import type { InferSelectModel } from 'drizzle-orm'

import { caseMemberModel } from '@/case-management/database/drizzle/models'

export type DrizzleCaseMember = InferSelectModel<typeof caseMemberModel>
