import type { Entity } from '../../../shared/domain/entities/entity'

export type PackageDocument = Entity & {
  documentPackageId: string
  documentId: string
  documentSpecificationId: string
  createdAt: Date
  updatedAt: Date
}
