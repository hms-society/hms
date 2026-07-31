import type { InferSelectModel } from 'drizzle-orm'

import { collaboratorRegistrationAttemptModel } from '@/identity/database/drizzle/models'

export type DrizzleCollaboratorRegistrationAttempt = InferSelectModel<
  typeof collaboratorRegistrationAttemptModel
>
