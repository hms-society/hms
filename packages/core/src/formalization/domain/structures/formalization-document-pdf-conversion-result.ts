export type FormalizationDocumentPdfConversionResult = {
  readonly contentType: 'application/pdf'
  readonly content: Uint8Array
  readonly converterVersion: string
}
