export interface FormalizationSignatureDocumentMetadataReader {
  findMetadata(input: { formalizationId: string; previewId: string }): Promise<{
    privateFileId: string
    sha256: string
    byteCount: number
  } | null>
}
