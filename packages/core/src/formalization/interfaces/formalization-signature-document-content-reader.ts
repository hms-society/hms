export interface FormalizationSignatureDocumentContentReader {
  readContent(privateFileId: string): Promise<Uint8Array | null>
}
