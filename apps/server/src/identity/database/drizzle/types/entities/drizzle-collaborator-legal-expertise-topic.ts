import type { InferSelectModel } from 'drizzle-orm'

import { collaboratorLegalExpertiseTopicModel } from '@/identity/database/drizzle/models'

export type DrizzleCollaboratorLegalExpertiseTopic = InferSelectModel<
  typeof collaboratorLegalExpertiseTopicModel
>
