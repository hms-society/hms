import type { FrozenDocumentPdf } from '../domain/entities'

export interface DocumentPdfFreezeService {
  freeze(request: {
    readonly documentId: string
    readonly documentVersionId: string
    readonly documentSpecificationId: string
    readonly traceId: string
  }): Promise<FrozenDocumentPdf>
}
