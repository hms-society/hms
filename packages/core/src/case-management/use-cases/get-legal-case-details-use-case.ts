import { AppError } from '#shared/domain/errors'

import type { LegalCaseSummary } from '../domain/entities'
import type {
  CaseCollaboratorsProvider,
  CaseMembersRepository,
  LegalCasesRepository,
} from '../interfaces'
import type { ClientsRepository } from '../../identity/interfaces/clients-repository'
import type { LegalAreasRepository } from '../../legal-catalog/interfaces/legal-areas-repository'
import type { LegalTopicsRepository } from '../../legal-catalog/interfaces/legal-topics-repository'
import { projectLegalCaseSummary } from './project-legal-case-summary'
import { ForbiddenError } from '#shared/domain/errors/forbidden-error'
import { CollaboratorProfile, UserStatus } from '#shared/domain/structures'
import { CaseMemberRole } from '../domain/structures'

export type GetLegalCaseDetailsUseCaseParams = {
  caseId: string
  actorId: string
}

export class GetLegalCaseDetailsUseCase {
  constructor(
    private readonly legalCasesRepository: LegalCasesRepository,
    private readonly clientsRepository: ClientsRepository,
    private readonly legalAreasRepository: LegalAreasRepository,
    private readonly legalTopicsRepository: LegalTopicsRepository,
    private readonly caseMembersRepository: CaseMembersRepository,
    private readonly collaboratorsProvider: CaseCollaboratorsProvider,
  ) {}

  async execute(params: GetLegalCaseDetailsUseCaseParams): Promise<LegalCaseSummary> {
    const actor = await this.collaboratorsProvider.findById(params.actorId)
    if (!actor || actor.status !== UserStatus.Active) {
      throw new ForbiddenError('Acesso jurídico ao Caso não autorizado.')
    }
    const legalCase = await this.legalCasesRepository.findById(params.caseId)

    if (!legalCase) {
      throw new AppError('Caso jurídico não encontrado.', 'Caso Inexistente')
    }

    const isAdmin = actor.profile === CollaboratorProfile.Admin
    const isLegalCollaborator =
      actor.profile === CollaboratorProfile.Lawyer ||
      actor.profile === CollaboratorProfile.Paralegal ||
      actor.profile === CollaboratorProfile.Supervisor
    if (!isAdmin && !isLegalCollaborator) {
      throw new ForbiddenError('Acesso jurídico ao Caso não autorizado.')
    }
    if (!isAdmin) {
      const membership = await this.caseMembersRepository.findByCaseAndCollaborator(
        params.caseId,
        params.actorId,
      )
      if (
        !membership ||
        membership.removedAt ||
        membership.archivedLegacy ||
        membership.role !== CaseMemberRole.Manager &&
          membership.role !== CaseMemberRole.Collaborator
      ) {
        throw new ForbiddenError('Acesso jurídico ao Caso não autorizado.')
      }
    }

    return projectLegalCaseSummary(legalCase, {
      clientsRepository: this.clientsRepository,
      legalAreasRepository: this.legalAreasRepository,
      legalTopicsRepository: this.legalTopicsRepository,
      caseMembersRepository: this.caseMembersRepository,
      collaboratorsProvider: this.collaboratorsProvider,
    })
  }
}
