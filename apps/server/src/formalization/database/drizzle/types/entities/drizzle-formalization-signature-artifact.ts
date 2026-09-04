import type { InferSelectModel } from 'drizzle-orm'

import { formalizationSignatureArtifactModel } from '@/formalization/database/drizzle/models/formalization-signature-artifact-model'

export type DrizzleFormalizationSignatureArtifact = InferSelectModel<
  typeof formalizationSignatureArtifactModel
>
