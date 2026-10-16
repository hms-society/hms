import type { CaseChecklistItem } from '../domain/entities'
import type { UseCase } from '../../shared/interfaces/use-case'
import type {
  LegalCasesRepository,
  CaseChecklistItemsRepository,
  CaseAccessProvider,
} from '../interfaces'
import type { ChecklistDocumentRequest } from '../domain/structures'
import { CaseAccessIntent } from '../domain/structures'
import { NotFoundError } from '../../shared/domain/errors/not-found-error'
type Request = ChecklistDocumentRequest & {
  write: boolean
  intent?: typeof CaseAccessIntent.ManageDocumentException
}
type Response = { item: CaseChecklistItem; clientId: string }

export class ResolveChecklistDocumentContextUseCase
  implements UseCase<Request, Response>
{
  constructor(
    private readonly cases: LegalCasesRepository,
    private readonly items: CaseChecklistItemsRepository,
    private readonly access: CaseAccessProvider,
  ) {}
  async execute(request: Request): Promise<Response> {
    await this.access.authorize({
      caseId: request.caseId,
      actorId: request.actorId,
      intent:
        request.intent ??
        (request.write ? CaseAccessIntent.WriteContent : CaseAccessIntent.ReadDocument),
    })
    const legalCase = await this.cases.findById(request.caseId)
    const item = await this.items.findById(request.caseId, request.checklistItemId)
    if (!legalCase || !item) throw new NotFoundError('O caso ou item não foi encontrado.')
    return { item, clientId: legalCase.clientId }
  }
}
