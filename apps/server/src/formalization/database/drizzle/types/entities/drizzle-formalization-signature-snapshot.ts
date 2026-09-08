import type { InferSelectModel } from 'drizzle-orm'

import { formalizationSignatureSnapshotModel } from '@/formalization/database/drizzle/models/formalization-signature-snapshot-model'

export type DrizzleFormalizationSignatureSnapshot = InferSelectModel<
  typeof formalizationSignatureSnapshotModel
>
