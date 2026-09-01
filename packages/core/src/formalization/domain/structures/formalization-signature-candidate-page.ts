import type { FormalizationSignatureCandidate } from './formalization-signature-candidate'

export type FormalizationSignatureCandidatePage = {
  readonly items: ReadonlyArray<FormalizationSignatureCandidate>
  readonly page: number
  readonly limit: number
  readonly total: number
}
