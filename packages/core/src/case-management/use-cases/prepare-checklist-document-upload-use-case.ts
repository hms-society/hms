import type {
  ChecklistUploadTicket,
  PrepareChecklistUpload,
} from '../../document-engine/domain/structures'
import type { UseCase } from '../../shared/interfaces/use-case'
import type {
  LegalCasesRepository,
  CaseChecklistItemsRepository,
  CaseAccessProvider,
} from '../interfaces'
import type { ClientDocumentsProvider } from '../../document-engine/interfaces/client-documents-provider'
import { ResolveChecklistDocumentContextUseCase } from './resolve-checklist-document-context-use-case'
import { ConflictError } from '../../shared/domain/errors/conflict-error'
type Request = Omit<PrepareChecklistUpload, 'clientId'>
type Response = ChecklistUploadTicket

export class PrepareChecklistDocumentUploadUseCase implements UseCase<Request, Response> {
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
    const { item, clientId } = await this.context.execute({ ...request, write: true })
    if (item.status === 'validated') throw new ConflictError('O item já foi validado.')
    return this.documents.prepareUpload({ ...request, clientId })
  }
}
