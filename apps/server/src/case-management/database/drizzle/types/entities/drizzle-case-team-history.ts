import type { InferSelectModel } from 'drizzle-orm'
import { caseTeamHistoryModel } from '@/case-management/database/drizzle/models'

export type DrizzleCaseTeamHistory = InferSelectModel<typeof caseTeamHistoryModel>
