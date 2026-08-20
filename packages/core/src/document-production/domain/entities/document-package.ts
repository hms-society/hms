import type { DocumentPackageContext } from '../structures'
import type { PackageDocument } from './package-document'

export type DocumentPackage = {
  readonly id: string
  readonly context: DocumentPackageContext
  readonly documents: readonly PackageDocument[]
  readonly confirmedAt?: Date
  readonly confirmedByCollaboratorId?: string
  readonly createdAt: Date
  readonly updatedAt: Date
}
