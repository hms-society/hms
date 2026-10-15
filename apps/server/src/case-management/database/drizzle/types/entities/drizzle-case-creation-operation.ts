import type { InferSelectModel } from 'drizzle-orm'
import { caseCreationOperationModel } from '@/case-management/database/drizzle/models'

export type DrizzleCaseCreationOperation = InferSelectModel<
  typeof caseCreationOperationModel
>
