import type { PackageDocumentStatus } from '../structures'

type PackageDocumentBase = {
  id: string
  documentId: string
  documentSpecificationId?: string
  createdAt: Date
  updatedAt: Date
}

type UnapprovedPackageDocument = PackageDocumentBase & {
  status:
    | typeof PackageDocumentStatus.Generating
    | typeof PackageDocumentStatus.InReview
    | typeof PackageDocumentStatus.AwaitingInformation
    | typeof PackageDocumentStatus.ManualDraft
    | typeof PackageDocumentStatus.GenerationFailed
  approvedAt?: never
  approvedByCollaboratorId?: never
}

type ApprovedPackageDocument = PackageDocumentBase & {
  status: typeof PackageDocumentStatus.Approved
  approvedAt: Date
  approvedByCollaboratorId: string
}

export type PackageDocument = UnapprovedPackageDocument | ApprovedPackageDocument
