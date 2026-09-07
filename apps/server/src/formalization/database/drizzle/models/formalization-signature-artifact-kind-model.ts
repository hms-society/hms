import { pgEnum } from 'drizzle-orm/pg-core'

export const formalizationSignatureArtifactKindModel = pgEnum(
  'formalization_signature_artifact_kind',
  ['signed_pdf', 'provider_certificate', 'provider_evidence'],
)
