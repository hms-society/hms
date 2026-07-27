export const PackageDocumentStatus = {
  Generating: 'generating',
  InReview: 'in_review',
  AwaitingInformation: 'awaiting_information',
  ManualDraft: 'manual_draft',
  GenerationFailed: 'generation_failed',
  Approved: 'approved',
} as const

export type PackageDocumentStatus =
  (typeof PackageDocumentStatus)[keyof typeof PackageDocumentStatus]
