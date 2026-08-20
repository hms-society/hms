import type { InferSelectModel } from 'drizzle-orm'

import { dynamicFormModel } from '@/shared/database/drizzle/models/dynamic-form-model'

export type DrizzleDynamicForm = InferSelectModel<typeof dynamicFormModel>
