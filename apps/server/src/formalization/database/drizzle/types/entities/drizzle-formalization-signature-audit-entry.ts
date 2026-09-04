import type { InferSelectModel } from 'drizzle-orm'

import { formalizationSignatureAuditEntryModel } from '@/formalization/database/drizzle/models/formalization-signature-audit-entry-model'

export type DrizzleFormalizationSignatureAuditEntry = InferSelectModel<
  typeof formalizationSignatureAuditEntryModel
>
