import type { InferSelectModel } from 'drizzle-orm'

import { formalizationSignatureProvisioningAttemptModel } from '@/formalization/database/drizzle/models/formalization-signature-provisioning-attempt-model'

export type DrizzleFormalizationSignatureProvisioningAttempt = InferSelectModel<
  typeof formalizationSignatureProvisioningAttemptModel
>
