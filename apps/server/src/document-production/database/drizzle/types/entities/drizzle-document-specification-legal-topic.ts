import type { InferSelectModel } from 'drizzle-orm'

import { documentSpecificationLegalTopicModel } from '@/document-production/database/drizzle/models'

export type DrizzleDocumentSpecificationLegalTopic = InferSelectModel<
  typeof documentSpecificationLegalTopicModel
>
