import type { CollaboratorSummary } from '../domain/entities'
import type { CollaboratorListQuery, AuthUser } from '../domain/structures'
import type { CollaboratorsRepository } from '../interfaces'
import type { UseCase } from '#shared/interfaces/use-case'
import type { PaginationResponse } from '#shared/responses/pagination-response.ts'

import type { AuthorizeAdminUseCase } from './authorize-admin-use-case'

type Request = {
  readonly authUser: AuthUser
  readonly query?: CollaboratorListQuery
}

export class ListCollaboratorsUseCase
  implements UseCase<Request, PaginationResponse<CollaboratorSummary>>
{
  constructor(
    private readonly collaboratorsRepository: CollaboratorsRepository,
    private readonly authorizeAdminUseCase: AuthorizeAdminUseCase,
  ) {}

  async execute({
    authUser,
    query,
  }: Request): Promise<PaginationResponse<CollaboratorSummary>> {
    await this.authorizeAdminUseCase.execute({ authUser })

    return this.collaboratorsRepository.list(this.normalizeQuery(query, authUser.id))
  }

  private normalizeQuery(
    query: CollaboratorListQuery = {},
    excludeUserId?: string,
  ): CollaboratorListQuery {
    const normalizedQuery: CollaboratorListQuery = {
      page: this.normalizePage(query.page),
      pageSize: this.normalizePageSize(query.limit ?? query.pageSize),
      ...(excludeUserId ? { excludeUserId } : {}),
      ...(this.normalizeText(query.search)
        ? { search: this.normalizeText(query.search) }
        : {}),
      ...(this.normalizeText(query.jobTitle)
        ? { jobTitle: this.normalizeText(query.jobTitle) }
        : {}),
      ...(query.profile ? { profile: query.profile } : {}),
      ...(query.status ? { status: query.status } : {}),
    }

    return normalizedQuery
  }

  private normalizePage(page?: number): number {
    if (!Number.isFinite(page) || !page || page < 1) return 1

    return Math.max(1, Math.floor(page))
  }

  private normalizePageSize(pageSize?: number): number {
    if (!Number.isFinite(pageSize) || !pageSize || pageSize < 1) return 20

    return Math.min(100, Math.max(1, Math.floor(pageSize)))
  }

  private normalizeText(value?: string): string | undefined {
    const normalizedValue = value?.trim()
    return normalizedValue || undefined
  }
}
