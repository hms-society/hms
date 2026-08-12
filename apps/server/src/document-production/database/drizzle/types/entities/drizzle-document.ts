import type { InferSelectModel } from 'drizzle-orm'

import type { documentModel } from '@/document-production/database/drizzle/models'

export type DrizzleDocument = InferSelectModel<typeof documentModel>
