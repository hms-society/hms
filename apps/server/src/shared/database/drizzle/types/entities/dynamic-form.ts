import type { InferSelectModel } from 'drizzle-orm'

import { dynamicFormModel } from '@/legal-catalog/database/drizzle/models/dynamic-form-model'

export type DrizzleDynamicForm = InferSelectModel<typeof dynamicFormModel>
