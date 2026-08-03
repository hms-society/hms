import type { InferSelectModel } from 'drizzle-orm'

import { collaboratorModel } from '@/identity/database/drizzle/models'

export type DrizzleCollaborator = InferSelectModel<typeof collaboratorModel>
