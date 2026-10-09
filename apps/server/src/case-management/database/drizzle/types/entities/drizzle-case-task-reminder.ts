import type { InferSelectModel } from 'drizzle-orm'

import { caseTaskReminderModel } from '@/case-management/database/drizzle/models'

export type DrizzleCaseTaskReminder = InferSelectModel<typeof caseTaskReminderModel>
