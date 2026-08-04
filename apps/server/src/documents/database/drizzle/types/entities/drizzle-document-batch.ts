import type { InferSelectModel } from 'drizzle-orm'
import { documentBatchModel, documentBatchFileModel } from '../../models'

export type DrizzleDocumentBatchFile = InferSelectModel<typeof documentBatchFileModel>

export type DrizzleDocumentBatch = InferSelectModel<typeof documentBatchModel> & {
  files: DrizzleDocumentBatchFile[]
}