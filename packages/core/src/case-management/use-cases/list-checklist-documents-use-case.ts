import type { ClientDocument } from '../../document-engine/domain/entities'
import type { UseCase } from '../../shared/interfaces/use-case'
import type {
  LegalCasesRepository,
  CaseChecklistItemsRepository,
  CaseAccessProvider,
} from '../interfaces'
import type { ChecklistDocumentRequest } from '../domain/structures'
import type { ClientDocumentsProvider } from '../../document-engine/interfaces/client-documents-provider'
import { ResolveChecklistDocumentContextUseCase } from './resolve-checklist-document-context-use-case'
type Request = ChecklistDocumentRequest
type Response = readonly ClientDocument[]

export class ListChecklistDocumentsUseCase implements UseCase<Request, Response> {
  private readonly context: ResolveChecklistDocumentContextUseCase
  constructor(
    cases: LegalCasesRepository,
    items: CaseChecklistItemsRepository,
    access: CaseAccessProvider,
    private readonly documents: ClientDocumentsProvider,
  ) {
    this.context = new ResolveChecklistDocumentContextUseCase(cases, items, access)
  }
  async execute(request: Request): Promise<Response> {
    const { clientId } = await this.context.execute({ ...request, write: true })
    return this.documents.listAvailable({
      clientId,
      actorId: request.actorId,
      caseId: request.caseId,
    })
  }
}
