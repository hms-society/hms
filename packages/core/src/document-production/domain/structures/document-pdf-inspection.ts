import type { DocumentPdfPage } from './document-pdf-page'

export type DocumentPdfInspection = {
  readonly pageCount: number
  readonly pages: readonly DocumentPdfPage[]
}
