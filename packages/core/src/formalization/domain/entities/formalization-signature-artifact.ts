import type { Entity } from '#shared/domain/entities/entity'
import type { FormalizationSignatureArtifactKind } from '../structures/formalization-signature-artifact-kind'

export type FormalizationSignatureArtifact = Entity & {
  requestId: string
  requestDocumentId?: string
  kind: FormalizationSignatureArtifactKind
  privateFileId: string
  sha256: string
  byteCount: number
  mediaType: string
  providerReference?: string
  preservedAt: Date
}
