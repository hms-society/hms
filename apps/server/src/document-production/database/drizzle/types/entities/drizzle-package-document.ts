import type { InferSelectModel } from 'drizzle-orm'

import type { packageDocumentModel } from '@/document-production/database/drizzle/models'

export type DrizzlePackageDocument = InferSelectModel<typeof packageDocumentModel>
