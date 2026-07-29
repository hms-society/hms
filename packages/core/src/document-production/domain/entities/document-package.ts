import type { DocumentPackageContext, DocumentPackageStatus } from '../structures'
import type { PackageDocument } from './package-document'

type DocumentPackageBase = {
  id: string
  context: DocumentPackageContext
  documents: PackageDocument[]
  createdAt: Date
  updatedAt: Date
}

type ReviewingDocumentPackage = DocumentPackageBase & {
  status: typeof DocumentPackageStatus.Reviewing
  confirmedAt?: never
  confirmedByCollaboratorId?: never
}

type ConfirmedDocumentPackage = DocumentPackageBase & {
  status: typeof DocumentPackageStatus.Confirmed
  confirmedAt: Date
  confirmedByCollaboratorId: string
}

export type DocumentPackage = ReviewingDocumentPackage | ConfirmedDocumentPackage
