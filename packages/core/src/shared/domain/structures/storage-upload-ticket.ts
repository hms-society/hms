export type StorageUploadTicket = {
  signedUrl: string
  token: string
  path: string
  bucket: string
  expiresAt: Date
}
