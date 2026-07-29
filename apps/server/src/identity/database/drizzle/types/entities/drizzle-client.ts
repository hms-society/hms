import type { InferSelectModel } from 'drizzle-orm'

import { clientModel } from '@/identity/database/drizzle/models'

export type DrizzleClient = InferSelectModel<typeof clientModel>
