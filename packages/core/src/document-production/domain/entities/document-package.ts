import type { DocumentPackageContext } from '../structures'
import type { PackageDocument } from './package-document'
import type { Entity } from '../../../shared/domain/entities/entity'

export type DocumentPackage = Entity & {
  context: DocumentPackageContext
  documents: PackageDocument[]
  confirmedAt?: Date
  confirmedByCollaboratorId?: string
  createdAt: Date
  updatedAt: Date
}
