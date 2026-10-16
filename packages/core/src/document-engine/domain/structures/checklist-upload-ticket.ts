import type { StorageUploadTicket } from '#shared/domain/structures/storage-upload-ticket'
export type ChecklistUploadTicket = StorageUploadTicket & { uploadId: string; alreadyUploaded: boolean }
