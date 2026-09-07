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
    await this.storageProvider.upload(input.filePath, input.content, input.contentType)

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
}
