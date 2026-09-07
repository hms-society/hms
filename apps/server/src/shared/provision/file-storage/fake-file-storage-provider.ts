import { randomUUID } from 'node:crypto'

import type { File } from '@hms/core/shared/domain/entities'
import type { SaveFileInput, StoredFileContent } from '@hms/core/shared/domain/structures'
import type { FileStorageProvider } from '@hms/core/shared/interfaces'
import { Injectable } from '@nestjs/common'

@Injectable()
export class FakeFileStorageProvider implements FileStorageProvider {
  private readonly files = new Map<string, StoredFileContent>()

  async save(input: SaveFileInput): Promise<File> {
    const file: File = {
      id: randomUUID(),
      filePath: input.filePath,
      fileName: input.fileName,
      contentType: input.contentType,
      sizeInBytes: input.sizeInBytes,
      createdAt: new Date(),
    }

    this.files.set(file.id, {
      content: input.content.slice(),
      file,
    })

    return file
  }

  async get(fileId: string): Promise<StoredFileContent | null> {
    const storedFile = this.files.get(fileId)
    if (!storedFile) return null

    return {
      file: storedFile.file,
      content: storedFile.content.slice(),
    }
  }

  async remove(fileId: string): Promise<void> {
    this.files.delete(fileId)
  }
}
