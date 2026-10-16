import type { ClientDocument } from '../../document-engine/domain/entities'
import type { CaseChecklistItem } from '../domain/entities'
import type { UseCase } from '../../shared/interfaces/use-case'
import type {
  LegalCasesRepository,
  CaseChecklistItemsRepository,
  CaseAccessProvider,
} from '../interfaces'
import type {
  ValidateChecklistDocumentRequest,
  ChecklistDocumentReference,
} from '../domain/structures'
import type { ClientDocumentsProvider } from '../../document-engine/interfaces/client-documents-provider'
import { ResolveChecklistDocumentContextUseCase } from './resolve-checklist-document-context-use-case'
import { CaseChecklistItemStatus } from '../domain/structures'
import type {
  ChecklistDocumentOperationsRepository,
  ChecklistDocumentHistoriesRepository,
  ChecklistDocumentTransactionProvider,
} from '../interfaces'
import type { DatetimeProvider } from '../../shared/interfaces/datetime-provider'
import { ConflictError } from '../../shared/domain/errors/conflict-error'
type Request = ValidateChecklistDocumentRequest
type Response = CaseChecklistItem

export class ValidateChecklistDocumentUseCase implements UseCase<Request, Response> {
  private readonly context: ResolveChecklistDocumentContextUseCase
  constructor(
    cases: LegalCasesRepository,
    private readonly items: CaseChecklistItemsRepository,
    access: CaseAccessProvider,
    private readonly documents: ClientDocumentsProvider,
    private readonly operations: ChecklistDocumentOperationsRepository,
    private readonly histories: ChecklistDocumentHistoriesRepository,
    private readonly transaction: ChecklistDocumentTransactionProvider,
    private readonly datetime: DatetimeProvider,
  ) {
    this.context = new ResolveChecklistDocumentContextUseCase(cases, items, access)
  }
  async execute(request: Request): Promise<Response> {
    return this.transaction.runInTransaction(() => this.validateCurrent(request))
  }

  private async validateCurrent(request: Request): Promise<Response> {
    const { item, clientId } = await this.context.execute({ ...request, write: true })
    const fingerprint = this.fingerprint(request)
    const previous = await this.operations.find(request)
    if (previous) {
      if (
        (previous.kind ?? 'document') !== 'document' ||
        previous.fingerprint !== fingerprint
      )
        throw new ConflictError('A operação foi reutilizada com dados diferentes.')
      return previous.result
    }
    this.assertRevision(item, request)
    return this.applyReview(request, item, clientId, fingerprint)
  }

  private async applyReview(
    request: Request,
    item: CaseChecklistItem,
    clientId: string,
    fingerprint: string,
  ): Promise<Response> {
    const updatedAt = new Date(
      Math.max(this.datetime.now().getTime(), item.updatedAt.getTime() + 1),
    )
    if (
      !item.documentReference ||
      item.documentReference.clientDocumentId !== request.clientDocumentId
    )
      throw new ConflictError('A associação mudou. Atualize o checklist.')
    const document = await this.documents.resolve({
      clientId,
      actorId: request.actorId,
      caseId: request.caseId,
      documentId: request.clientDocumentId,
      forSelection: false,
    })
    const reference = item.documentReference
    const result = await this.replaceItem(request, item, document, reference, updatedAt)
    if (document.source.kind === 'received_file')
      await this.documents.confirmReceivedReview({
        documentId: document.id,
        clientId,
        caseId: request.caseId,
        checklistItemId: item.id,
        actorId: request.actorId,
        reviewedAt: updatedAt,
      })
    await this.recordAction(request, item, reference, result, fingerprint, updatedAt)
    return result
  }

  private async recordAction(
    request: Request,
    item: CaseChecklistItem,
    reference: ChecklistDocumentReference,
    result: Response,
    fingerprint: string,
    updatedAt: Date,
  ): Promise<void> {
    if (item.waiver)
      await this.histories.add({
        caseId: request.caseId,
        checklistItemId: item.id,
        action: 'waiver_replaced',
        reference: { document: reference, waiver: item.waiver },
        actorId: request.actorId,
        createdAt: updatedAt,
      })
    await this.histories.add({
      caseId: request.caseId,
      checklistItemId: item.id,
      action: 'validated',
      reference,
      actorId: request.actorId,
      createdAt: updatedAt,
    })
    await this.operations.add({
      caseId: request.caseId,
      actorId: request.actorId,
      operationId: request.operationId,
      fingerprint,
      result,
      createdAt: updatedAt,
    })
  }

  private async replaceItem(
    request: Request,
    item: CaseChecklistItem,
    document: ClientDocument,
    reference: ChecklistDocumentReference,
    updatedAt: Date,
  ): Promise<Response> {
    const result = await this.items.replace(
      item.id,
      {
        status: CaseChecklistItemStatus.Validated,
        documentReference: reference,
        documentFileName: document.name,
        documentFileId:
          document.source.kind === 'received_file' ? document.source.fileId : undefined,
        validatedAt: updatedAt,
        validatedBy: request.actorId,
        updatedAt,
      },
      {
        caseId: request.caseId,
        updatedAt: request.expectedUpdatedAt,
        clientDocumentId: item.documentReference?.clientDocumentId,
      },
    )
    if (!result) throw new ConflictError('O item mudou. Atualize o checklist.')
    return result
  }

  private fingerprint(request: Request): string {
    return JSON.stringify([
      'validate-checklist-document',
      request.checklistItemId,
      request.clientDocumentId,
      request.expectedUpdatedAt,
    ])
  }

  private assertRevision(item: CaseChecklistItem, request: Request): void {
    if (
      item.updatedAt.toISOString() !== new Date(request.expectedUpdatedAt).toISOString()
    )
      throw new ConflictError('O item mudou. Atualize o checklist.')
  }
}
