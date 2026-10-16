import type { UseCase } from '#shared/interfaces/use-case'
import { ForbiddenError } from '#shared/domain/errors/forbidden-error'
import { NotFoundError } from '#shared/domain/errors/not-found-error'
import { CollaboratorProfile, UserStatus } from '#identity/domain/structures'
import type { CaseOpeningSource } from '../domain/structures'
import type { CaseCollaboratorsProvider, CaseOpeningSourceProvider } from '../interfaces'

export type GetCaseOpeningSourceRequest = { intakeId: string; actorId: string }

export class GetCaseOpeningSourceUseCase
  implements UseCase<GetCaseOpeningSourceRequest, CaseOpeningSource>
{
  constructor(
    private readonly sourceProvider: CaseOpeningSourceProvider,
    private readonly caseCollaboratorsProvider: CaseCollaboratorsProvider,
  ) {}

  async execute(request: GetCaseOpeningSourceRequest): Promise<CaseOpeningSource> {
    const actor = await this.caseCollaboratorsProvider.findById(request.actorId)
    if (
      !actor ||
      actor.status !== UserStatus.Active ||
      (actor.profile !== CollaboratorProfile.Lawyer &&
        actor.profile !== CollaboratorProfile.Admin)
    ) {
      throw new ForbiddenError('Abertura de Caso não autorizada.')
    }
    const source = await this.sourceProvider.findByIntakeId(request.intakeId)
    if (!source) throw new NotFoundError('A origem de abertura não foi encontrada.')
    const suggested = source.assignedLawyerId
      ? await this.caseCollaboratorsProvider.findById(source.assignedLawyerId)
      : undefined
    const eligibleSuggestion =
      suggested?.profile === CollaboratorProfile.Lawyer &&
      suggested.status === UserStatus.Active
        ? suggested
        : undefined
    return { intakeId: source.intakeId, suggestedManager: eligibleSuggestion }
  }
}
