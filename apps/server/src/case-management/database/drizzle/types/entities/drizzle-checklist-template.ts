import type { InferSelectModel } from 'drizzle-orm'

import { checklistTemplateModel } from '@/case-management/database/drizzle/models'

export type DrizzleChecklistTemplate = InferSelectModel<typeof checklistTemplateModel>
