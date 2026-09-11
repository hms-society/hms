import type { InferSelectModel } from 'drizzle-orm'

import { checklistTemplateItemModel } from '@/case-management/database/drizzle/models'

export type DrizzleChecklistTemplateItem = InferSelectModel<
  typeof checklistTemplateItemModel
>
