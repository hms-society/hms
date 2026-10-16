import type { InferSelectModel } from 'drizzle-orm'

import type { documentVersionHomologationModel } from '@/document-production/database/drizzle/models'

export type DrizzleDocumentVersionHomologation = InferSelectModel<
  typeof documentVersionHomologationModel
>
