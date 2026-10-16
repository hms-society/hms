import type { ClientDocument } from '../../document-engine/domain/entities'
import type { CaseChecklistItem } from '../domain/entities'
import type { UseCase } from '../../shared/interfaces/use-case'
import type {
  LegalCasesRepository,
  CaseChecklistItemsRepository,
  CaseAccessProvider,
} from '../interfaces'
import type {
  ChecklistDocumentRequest,
  ChecklistDocumentReference,
} from '../domain/structures'
import type { ClientDocumentsProvider } from '../../document-engine/interfaces/client-documents-provider'
import { ResolveChecklistDocumentContextUseCase } from './resolve-checklist-document-context-use-case'
import type { ChecklistDocumentAction } from '../domain/structures'
import { CaseChecklistItemStatus } from '../domain/structures'
import type {
  ChecklistDocumentOperationsRepository,
  ChecklistDocumentHistoriesRepository,
  ChecklistDocumentTransactionProvider,
} from '../interfaces'
import type { DatetimeProvider } from '../../shared/interfaces/datetime-provider'
import { ConflictError } from '../../shared/domain/errors/conflict-error'
type Request = ChecklistDocumentRequest & ChecklistDocumentAction
type Response = CaseChecklistItem

export class AttachChecklistDocumentUseCase implements UseCase<Request, Response> {
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
    const initial = await this.context.execute({ ...request, write: true })
    const knownOperation = await this.operations.find(request)
    let uploadedDocumentId: string | undefined
    if (request.kind === 'upload' && !knownOperation) {
      if (
        initial.item.status === CaseChecklistItemStatus.Validated ||
        initial.item.updatedAt.toISOString() !==
          new Date(request.expectedUpdatedAt).toISOString()
      )
        throw new ConflictError('O item mudou. Atualize o checklist.')
      uploadedDocumentId = (
        await this.documents.completeUpload({ ...request, clientId: initial.clientId })
      ).id
    }
    return this.transaction.runInTransaction(async () => {
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
      const updatedAt = new Date(
        Math.max(this.datetime.now().getTime(), item.updatedAt.getTime() + 1),
      )
      if (item.status === CaseChecklistItemStatus.Validated)
        throw new ConflictError('O item já foi validado.')
      const document = await this.resolveDocument(request, clientId, uploadedDocumentId)
      const reference = {
        clientDocumentId: document.id,
        source: document.source,
        attachedAt: updatedAt,
        attachedBy: request.actorId,
      }
      const result = await this.replaceItem(request, item, document, reference, updatedAt)
      await this.recordAction(request, item.id, reference, result, fingerprint, updatedAt)
      return result
    })
  }

  private async recordAction(
    request: Request,
    checklistItemId: string,
    reference: ChecklistDocumentReference,
    result: Response,
    fingerprint: string,
    updatedAt: Date,
  ): Promise<void> {
    await this.histories.add({
      caseId: request.caseId,
      checklistItemId,
      action: 'attached',
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
        status: item.waiver
          ? CaseChecklistItemStatus.Waived
          : CaseChecklistItemStatus.Pending,
        waiver: item.waiver,
        documentReference: reference,
        documentFileName: document.name,
        documentFileId:
          document.source.kind === 'received_file' ? document.source.fileId : undefined,
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
      'attach-checklist-document',
      request.checklistItemId,
      request.kind,
      request.kind === 'existing' ? request.documentId : request.uploadId,
      request.expectedUpdatedAt,
    ])
  }

  private assertRevision(item: CaseChecklistItem, request: Request): void {
    if (
      item.updatedAt.toISOString() !== new Date(request.expectedUpdatedAt).toISOString()
    )
      throw new ConflictError('O item mudou. Atualize o checklist.')
  }

  private async resolveDocument(
    request: Request,
    clientId: string,
    uploadedDocumentId: string | undefined,
  ): Promise<ClientDocument> {
    const documentId =
      request.kind === 'existing' ? request.documentId : uploadedDocumentId
    if (!documentId) throw new ConflictError('O envio mudou. Tente novamente.')
    return this.documents.resolve({
      clientId,
      actorId: request.actorId,
      caseId: request.caseId,
      documentId,
      forSelection: request.kind === 'existing',
    })
  }
}
