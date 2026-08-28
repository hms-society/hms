type FormalizationDocumentPdfPage = {
  readonly page: number
  readonly width: number
  readonly height: number
}

export type FormalizationDocumentPdfInspection = {
  readonly pageCount: number
  readonly pages: ReadonlyArray<FormalizationDocumentPdfPage>
}
