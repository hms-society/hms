import type { InferSelectModel } from 'drizzle-orm'

import { documentGenerationModel } from '@/document-production/database/drizzle/models'

export type DrizzleDocumentGeneration = InferSelectModel<typeof documentGenerationModel>
