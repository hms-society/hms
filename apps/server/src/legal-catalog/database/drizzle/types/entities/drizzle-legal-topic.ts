import type { InferSelectModel } from 'drizzle-orm'

import { legalTopicModel } from '@/legal-catalog/database/drizzle/models'

export type DrizzleLegalTopic = InferSelectModel<typeof legalTopicModel>
