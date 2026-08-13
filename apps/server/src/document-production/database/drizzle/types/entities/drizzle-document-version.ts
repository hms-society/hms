import type { InferSelectModel } from 'drizzle-orm'

import type { documentVersionModel } from '@/document-production/database/drizzle/models'

export type DrizzleDocumentVersion = InferSelectModel<typeof documentVersionModel>
