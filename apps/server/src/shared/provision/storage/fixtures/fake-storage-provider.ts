import type { StorageProvider } from '@hms/core/shared/interfaces'
import { Injectable } from '@nestjs/common'

@Injectable()
export class FakeStorageProvider implements StorageProvider {
  private readonly files = new Map<string, Uint8Array>()

  async upload(path: string, file: Uint8Array, _mimeType: string): Promise<string> {
    this.files.set(path, file.slice())
    return path
  }

  async download(path: string): Promise<Uint8Array> {
    const file = this.files.get(path)
    if (!file) throw new Error(`Test file not found: ${path}`)
    return file.slice()
  }

  async remove(path: string): Promise<void> {
    this.files.delete(path)
  }
}
