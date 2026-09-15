export interface FormalizationSignatureDocumentContentProvider {
  readContent(privateFileId: string): Promise<Uint8Array | null>
}
