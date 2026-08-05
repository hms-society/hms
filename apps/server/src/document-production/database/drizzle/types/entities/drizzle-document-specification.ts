import type { InferSelectModel } from 'drizzle-orm'

import { documentSpecificationModel } from '@/document-production/database/drizzle/models'

export type DrizzleDocumentSpecification = InferSelectModel<
  typeof documentSpecificationModel
>
