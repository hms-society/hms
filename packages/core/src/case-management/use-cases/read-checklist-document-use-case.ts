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
import { NotFoundError } from '../../shared/domain/errors/not-found-error'
type Request = ChecklistDocumentRequest
type Response = { document: ClientDocument; bytes: Uint8Array }

export class ReadChecklistDocumentUseCase implements UseCase<Request, Response> {
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
    const { item, clientId } = await this.context.execute({ ...request, write: false })
    if (!item.documentReference)
      throw new NotFoundError('O item não possui documento associado.')
    return this.documents.read({
      clientId,
      actorId: request.actorId,
      caseId: request.caseId,
      documentId: item.documentReference.clientDocumentId,
    })
  }
}
