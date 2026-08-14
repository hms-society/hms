import { randomUUID } from 'node:crypto'

import type { File } from '@hms/core/shared/domain/entities'
import type { SaveFileInput } from '@hms/core/shared/domain/structures'
import type { FileStorageProvider } from '@hms/core/shared/interfaces'
import { Injectable } from '@nestjs/common'

@Injectable()
export class FakeFileStorageProvider implements FileStorageProvider {
  private readonly files = new Map<
    string,
    { readonly content: Uint8Array; readonly file: File }
  >()

  async save(input: SaveFileInput): Promise<File> {
    const file: File = {
      id: randomUUID(),
      filePath: input.filePath,
      fileName: input.fileName,
      contentType: input.contentType,
      sizeInBytes: input.sizeInBytes,
      createdAt: new Date(),
    }

    this.files.set(file.filePath, {
      content: input.content.slice(),
      file,
    })

    return file
  }

  async remove(filePath: string): Promise<void> {
    this.files.delete(filePath)
  }
}
