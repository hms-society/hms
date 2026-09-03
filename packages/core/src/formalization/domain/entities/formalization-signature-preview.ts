import type { Entity } from '#shared/domain/entities'
import type {
  FormalizationSignaturePreviewFailureCode,
  FormalizationSignaturePreviewState,
} from '../structures'

type FormalizationSignaturePreviewPage = {
  readonly page: number
  readonly width: number
  readonly height: number
}

export type FormalizationSignaturePreview = Entity & {
  formalizationId: string
  documentId: string
  documentVersionId: string
  fileId?: string
  contentChecksumSha256?: string
  pdfChecksumSha256?: string
  converterVersion?: string
  pageCount?: number
  pages: ReadonlyArray<FormalizationSignaturePreviewPage>
  byteSize?: number
  state: FormalizationSignaturePreviewState
  attemptsCount: number
  attemptToken?: string
  processingStartedAt?: Date
  leaseExpiresAt?: Date
  failureCode?: FormalizationSignaturePreviewFailureCode
  createdAt: Date
  updatedAt: Date
}
