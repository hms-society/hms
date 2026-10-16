import { Inject, Injectable } from '@nestjs/common'
import { CollaboratorProfile, UserStatus } from '@hms/core/identity/domain/structures'
import type { CaseClosureAccessProvider } from '@hms/core/case-management/interfaces'
import type {
  CaseCollaboratorsProvider,
  CaseMembersRepository,
} from '@hms/core/case-management/interfaces'

import { CASE_MANAGEMENT_REPOSITORIES } from '@/case-management/constants/case-management-repositories'
import { CASE_MANAGEMENT_PROVIDERS } from '@/case-management/constants/case-management-providers'

const eligibleProfiles = new Set<string>([
  CollaboratorProfile.Lawyer,
  CollaboratorProfile.Paralegal,
  CollaboratorProfile.Supervisor,
])

@Injectable()
export class RepositoryCaseClosureAccessProvider implements CaseClosureAccessProvider {
  constructor(
    @Inject(CASE_MANAGEMENT_REPOSITORIES.caseMembers)
    private readonly caseMembersRepository: CaseMembersRepository,
    @Inject(CASE_MANAGEMENT_PROVIDERS.collaborators)
    private readonly collaboratorsProvider: CaseCollaboratorsProvider,
  ) {}

  async getActorAccess(caseId: string, actorId: string) {
    const [collaborator, member] = await Promise.all([
      this.collaboratorsProvider.findById(actorId),
      this.caseMembersRepository.findByCaseAndCollaborator(caseId, actorId),
    ])
    const isActive = collaborator?.status === UserStatus.Active
    return {
      // Controllers only call this adapter after AuthGuard and ActiveCollaboratorGuard
      // bind the authenticated session to this collaborator identifier.
      isAuthenticated: Boolean(collaborator),
      isActive,
      isEligible: Boolean(collaborator && eligibleProfiles.has(collaborator.profile)),
      role:
        member && !member.removedAt && !member.archivedLegacy ? member.role : undefined,
    }
  }
}
