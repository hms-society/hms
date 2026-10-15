import { Inject, Injectable } from '@nestjs/common'
import type { CaseCollaboratorsProvider } from '@hms/core/case-management/interfaces'
import type { CaseEligibleCollaborator } from '@hms/core/case-management/domain/structures'
import { CollaboratorProfile, UserStatus } from '@hms/core/identity/domain/structures'
import type { CollaboratorsRepository } from '@hms/core/identity/interfaces'
import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'

@Injectable()
export class RepositoryCaseCollaboratorsProvider implements CaseCollaboratorsProvider {
  constructor(
    @Inject(IDENTITY_REPOSITORIES.collaborators)
    private readonly collaboratorsRepository: CollaboratorsRepository,
  ) {}

  async findById(collaboratorId: string): Promise<CaseEligibleCollaborator | undefined> {
    const collaborator =
      await this.collaboratorsRepository.findSummaryById(collaboratorId)
    if (!collaborator) return undefined
    return {
      collaboratorId: collaborator.collaboratorId,
      professionalName: collaborator.professionalName,
      email: collaborator.email,
      profile: collaborator.profile,
      status: collaborator.status,
    }
  }

  async findByIds(
    collaboratorIds: readonly string[],
  ): Promise<readonly CaseEligibleCollaborator[]> {
    const collaborators =
      await this.collaboratorsRepository.findSummariesByIds(collaboratorIds)
    return collaborators.map((collaborator) => ({
      collaboratorId: collaborator.collaboratorId,
      professionalName: collaborator.professionalName,
      email: collaborator.email,
      profile: collaborator.profile,
      status: collaborator.status,
    }))
  }

  async listEligible(
    query: Parameters<CaseCollaboratorsProvider['listEligible']>[0],
    excludeCollaboratorIds: readonly string[] = [],
  ) {
    const result = await this.collaboratorsRepository.list({
      page: query.page,
      pageSize: query.pageSize,
      search: query.search?.trim() || undefined,
      profile: query.profile,
      profiles: [
        CollaboratorProfile.Lawyer,
        CollaboratorProfile.Paralegal,
        CollaboratorProfile.Supervisor,
      ],
      status: UserStatus.Active,
      excludeCollaboratorIds,
      nameOnlySearch: true,
    })
    return {
      items: result.items.map((collaborator) => ({
        collaboratorId: collaborator.collaboratorId,
        professionalName: collaborator.professionalName,
        email: collaborator.email,
        profile: collaborator.profile,
        status: collaborator.status,
      })),
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
      totalPages: result.totalPages,
    }
  }
}
