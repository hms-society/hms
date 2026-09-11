import type { UseCase } from '../../shared/interfaces'
import type { LegalCaseSummary } from '../domain/structures'
import type {
  CaseMembersRepository,
  LegalCasesRepository,
} from '../interfaces'

type Request = { readonly intakeId: string }

export class GetLegalCaseByIntakeUseCase
  implements UseCase<Request, LegalCaseSummary | null>
{
  constructor(
    private readonly legalCasesRepository: LegalCasesRepository,
    private readonly caseMembersRepository: CaseMembersRepository,
  ) {}

  async execute({ intakeId }: Request): Promise<LegalCaseSummary | null> {
    const legalCase = await this.legalCasesRepository.findByIntakeId(intakeId)
    if (!legalCase) return null

    const primaryMember = await this.caseMembersRepository.findPrimaryByCaseId(legalCase.id)
    return {
      caseId: legalCase.id,
      intakeId: legalCase.intakeId,
      publicCode: legalCase.publicCode,
      status: legalCase.status,
      legalAreaId: legalCase.legalAreaId,
      ...(primaryMember ? { primaryLawyerId: primaryMember.collaboratorId } : {}),
      openedAt: legalCase.openedAt,
    }
  }
}
