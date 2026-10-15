import type { StorageObjectMetadata, StorageUploadTicket } from '../domain/structures'
export interface StorageProvider {
  createSignedUpload(path: string): Promise<StorageUploadTicket>
  inspect(path: string): Promise<StorageObjectMetadata | undefined>
  upload(path: string, file: Uint8Array, mimeType: string): Promise<string>
  download(path: string): Promise<Uint8Array>
  remove(path: string): Promise<void>
}
