import type { StorageObjectMetadata, StorageUploadTicket } from '../domain/structures'
import type { StorageProvider } from './storage-provider'

export interface ClientDocumentUploadStorageProvider extends StorageProvider {
  createSignedUpload(path: string): Promise<StorageUploadTicket>
  inspect(path: string): Promise<StorageObjectMetadata | undefined>
}
