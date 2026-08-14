export const DocumentReviewFindingCategory = {
  Structure: 'structure',
  TemplateCoherence: 'template_coherence',
  PendingCorrespondence: 'pending_correspondence',
} as const

export type DocumentReviewFindingCategory =
  (typeof DocumentReviewFindingCategory)[keyof typeof DocumentReviewFindingCategory]
