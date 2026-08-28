export const FormalizationSignatureReadinessIssueCode = {
  PackageUnconfirmed: 'package_unconfirmed',
  InitializationRequired: 'initialization_required',
  PreparationPending: 'preparation_pending',
  PreviewFailed: 'preview_failed',
  VersionNotApproved: 'version_not_approved',
  DocumentUnassigned: 'document_unassigned',
  SignatoryUnassigned: 'signatory_unassigned',
  FieldMissing: 'field_missing',
  SelectedChannelMissing: 'selected_channel_missing',
  SelectedChannelUnavailable: 'selected_channel_unavailable',
} as const

export type FormalizationSignatureReadinessIssueCode =
  (typeof FormalizationSignatureReadinessIssueCode)[keyof typeof FormalizationSignatureReadinessIssueCode]
