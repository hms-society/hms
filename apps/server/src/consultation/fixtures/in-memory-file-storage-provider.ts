import { Injectable } from '@nestjs/common'
import type { File } from '@hms/core/shared/domain/entities'
import type { SaveFileInput, StoredFileContent } from '@hms/core/shared/domain/structures'
import type { FileStorageProvider } from '@hms/core/shared/interfaces'

import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { IdProvider } from '@/shared/provision/id/id-provider'

@Injectable()
export class InMemoryFileStorageProvider implements FileStorageProvider {
  private readonly files = new Map<string, StoredFileContent>()

  constructor(
    private readonly idProvider: IdProvider,
    private readonly datetimeProvider: DatetimeProvider,
  ) {}

  async save(input: SaveFileInput): Promise<File> {
    const file: File = {
      id: this.idProvider.generate(),
      filePath: input.filePath,
      fileName: input.fileName,
      contentType: input.contentType,
      sizeInBytes: input.sizeInBytes,
      createdAt: this.datetimeProvider.now(),
    }
    this.files.set(file.id, { file, content: input.content.slice() })
    return file
  }

  async get(fileId: string): Promise<StoredFileContent | null> {
    const storedFile = this.files.get(fileId)
    if (!storedFile) return null

    return { file: storedFile.file, content: storedFile.content.slice() }
  }

  async remove(fileId: string): Promise<void> {
    this.files.delete(fileId)
  }
}
