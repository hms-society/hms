import type {
  Collaborator,
  CollaboratorCreation,
  CollaboratorSummary,
  CollaboratorUpdate,
} from '../domain/entities'
import type { CollaboratorListQuery } from '../domain/structures'
import type { CollaboratorProfile } from '../domain/structures/collaborator-profile'
import type { PaginationResponse } from '#shared/responses/pagination-response.ts'

export interface CollaboratorsRepository {
  findById(collaboratorId: string): Promise<Collaborator | undefined>
  findSummaryById(collaboratorId: string): Promise<CollaboratorSummary | undefined>
  findByUserId(userId: string): Promise<Collaborator | undefined>
  findSummaryByUserId(userId: string): Promise<CollaboratorSummary | undefined>
  add(collaborator: CollaboratorCreation): Promise<Collaborator | undefined>
  replace(
    collaboratorId: string,
    changes: CollaboratorUpdate,
  ): Promise<Collaborator | undefined>
  removeById(collaboratorId: string): Promise<void>
  removeAll(): Promise<void>
  list(
    query: CollaboratorListQuery & {
      readonly profiles?: readonly CollaboratorProfile[]
    },
  ): Promise<PaginationResponse<CollaboratorSummary>>
  listAvailableJobTitles(): Promise<readonly string[]>
}
