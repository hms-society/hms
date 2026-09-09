export type DocumentReviewStatus = 'in_review' | 'approved' | 'rejected'
export type DocumentReviewGenerationState = 'idle' | 'generating' | 'failed'

export type DocumentReviewViewModel = {
  title: string
  versionNumber: number
  sourceLabel: string
  status: DocumentReviewStatus
  statusLabel: string
  isCurrent: boolean
  isApproved: boolean
  isInReview: boolean
  isRejected: boolean
  generationState: DocumentReviewGenerationState
  isGenerating: boolean
  isGenerationFailed: boolean
  createdAtLabel: string
  rejectionReason?: string
}
