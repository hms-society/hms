import type { InferSelectModel } from 'drizzle-orm'

import { userModel } from '@/identity/database/drizzle/models'

export type DrizzleUser = InferSelectModel<typeof userModel>
