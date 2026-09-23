import { Injectable } from '@nestjs/common'
import { randomUUID } from 'node:crypto'

import type { File } from '@hms/core/shared/domain/entities'
import type { SaveFileInput, StoredFileContent } from '@hms/core/shared/domain/structures'
import type { FileStorageProvider } from '@hms/core/shared/interfaces'

import { SupabaseStorageProvider } from '@/shared/provision/storage/supabase-storage-provider'

@Injectable()
export class SupabaseFileStorageProvider implements FileStorageProvider {
  private readonly files = new Map<string, File>()
  constructor(private readonly storage: SupabaseStorageProvider) {}

  async save(input: SaveFileInput): Promise<File> {
    const id = randomUUID()
    await this.storage.upload(input.filePath, input.content, input.contentType)
    const file = { id, filePath: input.filePath, fileName: input.fileName, contentType: input.contentType, sizeInBytes: input.sizeInBytes, createdAt: new Date() }
    this.files.set(id, file)
    return file
  }

  async get(fileId: string): Promise<StoredFileContent | null> {
    const file = this.files.get(fileId)
    if (!file) return null
    const content = await this.storage.download(file.filePath)
    return { file, content }
  }

  async remove(fileId: string): Promise<void> {
    const file = this.files.get(fileId)
    if (!file) return
    await this.storage.remove(file.filePath)
    this.files.delete(fileId)
  }
}
