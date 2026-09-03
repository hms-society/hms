export type DocumentFileMetadata = {
  mimeType: string
  sizeBytes: number
  hashSha256: string
  pageCount?: number
  textLength?: number
  extractedTextFull?: string
}
