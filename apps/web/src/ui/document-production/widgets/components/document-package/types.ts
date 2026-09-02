import type { DocumentStatusChipStatus } from '../document-status-chip'

export type DocumentPackageStatus = Exclude<DocumentStatusChipStatus, 'current'>

export type DocumentPackageVersion = {
  id: string
  versionNumber: number
  status: 'in_review' | 'approved' | 'rejected'
}

export type DocumentPackageItem = {
  id: string
  title: string
  latestVersion?: DocumentPackageVersion
  status: DocumentPackageStatus
  statusLabel: string
  isCurrent: boolean
  isGenerating: boolean
  isTimedOut: boolean
}

export type DocumentPackageAction = 'review' | 'view'
