import type { InferSelectModel } from 'drizzle-orm'

import type { documentPackageModel } from '@/document-production/database/drizzle/models'

export type DrizzleDocumentPackage = InferSelectModel<typeof documentPackageModel>
