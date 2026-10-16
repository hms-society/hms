import type { Entity } from '../../../shared/domain/entities/entity'
import type { CollaboratorProfile } from '../../../identity/domain/structures'

export type DocumentVersionHomologation = Entity & {
  caseId: string
  documentId: string
  documentVersionId: string
  approvedByCollaboratorId: string
  approvedByCollaboratorName: string
  approvedByCollaboratorProfile: CollaboratorProfile
  approvedAt: Date
  artifactFileId?: string
  artifactStoragePath?: string
  artifactContentType?: string
  artifactCreatedAt?: Date
}
