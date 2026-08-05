import type { InferSelectModel } from 'drizzle-orm'

import { documentSpecificationLegalAreaModel } from '@/document-production/database/drizzle/models'

export type DrizzleDocumentSpecificationLegalArea = InferSelectModel<
  typeof documentSpecificationLegalAreaModel
>
