import type { CollaboratorSummary } from '../domain/entities'
import {
  CollaboratorProfile,
  UserStatus,
  type CollaboratorListQuery,
} from '../domain/structures'
import type { CollaboratorsRepository } from '../interfaces'
import type { UseCase } from '#shared/interfaces/use-case'
import type { PaginationResponse } from '#shared/responses/pagination-response.ts'

type Request = {
  readonly query?: Pick<CollaboratorListQuery, 'page' | 'limit' | 'search' | 'profile' | 'jobTitle'>
}

export class ListActiveCollaboratorsUseCase
  implements UseCase<Request, PaginationResponse<CollaboratorSummary>>
{
  constructor(private readonly collaboratorsRepository: CollaboratorsRepository) {}

  execute({ query }: Request): Promise<PaginationResponse<CollaboratorSummary>> {
    return this.collaboratorsRepository.list({
      page: query?.page,
      limit: query?.limit,
      search: query?.search,
      profile: query?.profile,
      excludeProfiles: [CollaboratorProfile.Admin, CollaboratorProfile.Attendant],
      jobTitle: query?.jobTitle,
      status: UserStatus.Active,
    })
  }
}
