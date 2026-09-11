import type { InferSelectModel } from 'drizzle-orm'

import { frozenDocumentPdfModel } from '@/document-production/database/drizzle/models'

export type DrizzleFrozenDocumentPdf = InferSelectModel<typeof frozenDocumentPdfModel>
