import type { UseCase } from '#shared/interfaces'
import { NotFoundError } from '#shared/domain/errors'
import type { ClientDocumentsProvider } from '../../document-engine/interfaces'
import type { ClientDocument } from '../../document-engine/domain/entities'
import type { LegalCasesRepository, CaseAccessProvider } from '../interfaces'
import { CaseAccessIntent } from '../domain/structures'
type Request = { caseId: string; actorId: string }
export class ListCaseHistoryDocumentsUseCase
  implements UseCase<Request, readonly ClientDocument[]>
{
  constructor(
    private readonly cases: LegalCasesRepository,
    private readonly access: CaseAccessProvider,
    private readonly documents: ClientDocumentsProvider,
  ) {}
  async execute(request: Request): Promise<readonly ClientDocument[]> {
    await this.access.authorize({ ...request, intent: CaseAccessIntent.WriteContent })
    const legalCase = await this.cases.findById(request.caseId)
    if (!legalCase) throw new NotFoundError('Caso não encontrado.')
    return this.documents.listAvailable({ ...request, clientId: legalCase.clientId })
  }
}
