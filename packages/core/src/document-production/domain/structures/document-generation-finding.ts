import type { DocumentReviewFindingCategory } from './document-review-finding-category'

export type DocumentGenerationFinding = {
  readonly category: DocumentReviewFindingCategory
  readonly message: string
}
