import { documentBatchFileModel, documentBatchModel } from '../../models'

export type DrizzleDocumentValidation = typeof documentBatchFileModel.$inferSelect & {
  batch: typeof documentBatchModel.$inferSelect
  caseLabel?: string | null
  checklistItemLabel?: string | null
}
