export const DocumentPackageStatus = {
  Reviewing: 'reviewing',
  Confirmed: 'confirmed',
} as const

export type DocumentPackageStatus =
  (typeof DocumentPackageStatus)[keyof typeof DocumentPackageStatus]
