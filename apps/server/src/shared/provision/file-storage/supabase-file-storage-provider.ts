import { randomUUID } from 'node:crypto'
import { Inject, Injectable } from '@nestjs/common'

import type { File } from '@hms/core/shared/domain/entities'
import type { SaveFileInput, StoredFileContent } from '@hms/core/shared/domain/structures'
import type {
  FileStorageProvider,
  StorageProvider,
  StoredFilesRepository,
} from '@hms/core/shared/interfaces'
import { AppError } from '@hms/core/shared/domain/errors'

import { STORED_FILES_REPOSITORY } from '@/shared/database/drizzle/database.module'
import { PROVISION_PROVIDERS } from '@/shared/provision/constants/provision-providers'

@Injectable()
export class SupabaseFileStorageProvider implements FileStorageProvider {
  constructor(
    @Inject(STORED_FILES_REPOSITORY)
    private readonly storedFilesRepository: StoredFilesRepository,
    @Inject(PROVISION_PROVIDERS.storage)
    private readonly storageProvider: StorageProvider,
  ) {}

  async save(input: SaveFileInput): Promise<File> {
    const existing = await this.storedFilesRepository.findByFilePath(input.filePath)
    if (existing) {
      await this.assertExistingFile(existing, input)
      return existing
    }

    try {
      await this.storageProvider.upload(input.filePath, input.content, input.contentType)
    } catch (error) {
      const recovered = await this.storedFilesRepository.findByFilePath(input.filePath)
      if (recovered) {
        await this.assertExistingFile(recovered, input)
        return recovered
      }

      if (!input.reuseExisting) throw error

      const existingContent = await this.storageProvider.download(input.filePath)
      if (existingContent.byteLength !== input.sizeInBytes) throw error
    }

    const file: File = {
      id: randomUUID(),
      filePath: input.filePath,
      fileName: input.fileName,
      contentType: input.contentType,
      sizeInBytes: input.sizeInBytes,
      createdAt: new Date(),
    }

    try {
      return await this.storedFilesRepository.add(file)
    } catch (error) {
      const recovered = await this.storedFilesRepository.findByFilePath(input.filePath)
      if (recovered) {
        await this.assertExistingFile(recovered, input)
        return recovered
      }

      await this.removeUploadedObject(input.filePath)
      throw error
    }
  }

  async get(fileId: string): Promise<StoredFileContent | null> {
    const file = await this.storedFilesRepository.findById(fileId)
    if (!file) return null

    const content = await this.storageProvider.download(file.filePath)
    if (content.byteLength !== file.sizeInBytes) {
      throw new AppError(
        'Os metadados e o conteúdo do arquivo não correspondem.',
        'Erro no Armazenamento de Documentos',
      )
    }

    return { file, content }
  }

  async remove(fileId: string): Promise<void> {
    const file = await this.storedFilesRepository.findById(fileId)
    if (!file) return

    await this.storageProvider.remove(file.filePath)
    await this.storedFilesRepository.remove(file.id)
  }

  private async removeUploadedObject(filePath: string): Promise<void> {
    try {
      await this.storageProvider.remove(filePath)
    } catch {
      // The next cleanup pass can safely retry the idempotent object removal.
    }
  }

  private async assertExistingFile(existing: File, input: SaveFileInput): Promise<void> {
    if (
      existing.contentType !== input.contentType ||
      existing.sizeInBytes !== input.sizeInBytes
    ) {
      throw new AppError(
        'Já existe um arquivo diferente no caminho solicitado.',
        'Conflito no Armazenamento de Documentos',
      )
    }

    if (input.reuseExisting) return

    const content = await this.storageProvider.download(existing.filePath)
    if (content.byteLength !== input.content.byteLength) {
      throw new AppError(
        'O arquivo existente não corresponde ao conteúdo solicitado.',
        'Conflito no Armazenamento de Documentos',
      )
    }

    for (let index = 0; index < content.length; index += 1) {
      if (content[index] !== input.content[index]) {
        throw new AppError(
          'O arquivo existente não corresponde ao conteúdo solicitado.',
          'Conflito no Armazenamento de Documentos',
        )
      }
    }
  }
}
