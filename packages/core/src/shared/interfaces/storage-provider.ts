export interface StorageProvider {
  upload(path: string, file: Uint8Array, mimeType: string): Promise<string>
}