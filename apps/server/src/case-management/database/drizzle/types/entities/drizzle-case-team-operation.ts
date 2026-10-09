import type { InferSelectModel } from 'drizzle-orm'
import { caseTeamOperationModel } from '@/case-management/database/drizzle/models'

export type DrizzleCaseTeamOperation = InferSelectModel<typeof caseTeamOperationModel>
