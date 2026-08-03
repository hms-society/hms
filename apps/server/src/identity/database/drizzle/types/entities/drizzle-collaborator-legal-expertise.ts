import type { InferSelectModel } from 'drizzle-orm'

import { collaboratorLegalExpertiseModel } from '@/identity/database/drizzle/models'

export type DrizzleCollaboratorLegalExpertise = InferSelectModel<
  typeof collaboratorLegalExpertiseModel
>
