import type { UseCase, DatetimeProvider } from '#shared/interfaces'
import { ConflictError } from '#shared/domain/errors'
import type { CaseChecklistItem } from '../domain/entities'
import { CaseAccessIntent, CaseChecklistItemStatus } from '../domain/structures'
import type {
  RevokeChecklistDocumentWaiverRequest as Request,
  ChecklistDocumentWaiver,
} from '../domain/structures'
import type {
  LegalCasesRepository,
  CaseChecklistItemsRepository,
  CaseAccessProvider,
  ChecklistDocumentOperationsRepository,
  ChecklistDocumentHistoriesRepository,
  ChecklistDocumentTransactionProvider,
} from '../interfaces'
import { ResolveChecklistDocumentContextUseCase } from './resolve-checklist-document-context-use-case'
export class RevokeChecklistDocumentWaiverUseCase
  implements UseCase<Request, CaseChecklistItem>
{
  private readonly context: ResolveChecklistDocumentContextUseCase
  constructor(
    cases: LegalCasesRepository,
    private readonly items: CaseChecklistItemsRepository,
    access: CaseAccessProvider,
    private readonly operations: ChecklistDocumentOperationsRepository,
    private readonly histories: ChecklistDocumentHistoriesRepository,
    private readonly transaction: ChecklistDocumentTransactionProvider,
    private readonly datetime: DatetimeProvider,
  ) {
    this.context = new ResolveChecklistDocumentContextUseCase(cases, items, access)
  }
  async execute(request: Request): Promise<CaseChecklistItem> {
    return this.transaction.runInTransaction(() => this.applyWaiver(request))
  }
  private async applyWaiver(request: Request): Promise<CaseChecklistItem> {
    const { item } = await this.context.execute({
      ...request,
      write: true,
      intent: CaseAccessIntent.ManageDocumentException,
    })
    const fingerprint = JSON.stringify([
      'revoke-checklist-document-waiver',
      request.checklistItemId,
      request.expectedUpdatedAt,
    ])
    const previous = await this.operations.find(request)
    if (previous) {
      if (previous.kind !== 'waiver' || previous.fingerprint !== fingerprint)
        throw new ConflictError('A operação foi reutilizada com dados diferentes.')
      return previous.result
    }
    this.assertCurrentItem(item, request)

    const updatedAt = new Date(
      Math.max(this.datetime.now().getTime(), item.updatedAt.getTime() + 1),
    )
    const waiver = item.waiver
    if (!waiver) throw new ConflictError('O requisito não está dispensado.')
    return this.persistWaiver(request, item, waiver, fingerprint, updatedAt)
  }

  private async persistWaiver(
    request: Request,
    item: CaseChecklistItem,
    waiver: ChecklistDocumentWaiver,
    fingerprint: string,
    updatedAt: Date,
  ): Promise<CaseChecklistItem> {
    const result = await this.items.replace(
      item.id,
      {
        status: CaseChecklistItemStatus.Pending,
        waiver: undefined,
        documentReference: item.documentReference,
        documentFileId: item.documentFileId,
        documentFileName: item.documentFileName,
        validatedAt: undefined,
        validatedBy: undefined,
        updatedAt,
      },
      {
        caseId: request.caseId,
        updatedAt: request.expectedUpdatedAt,
        clientDocumentId: item.documentReference?.clientDocumentId,
      },
    )
    if (!result) throw new ConflictError('O item mudou. Atualize o checklist.')
    await this.recordWaiver(request, item.id, waiver, fingerprint, result, updatedAt)
    return result
  }
  private async recordWaiver(
    request: Request,
    checklistItemId: string,
    waiver: ChecklistDocumentWaiver,
    fingerprint: string,
    result: CaseChecklistItem,
    updatedAt: Date,
  ): Promise<void> {
    await this.histories.add({
      caseId: request.caseId,
      checklistItemId,
      action: 'waiver_revoked',
      reference: waiver,
      actorId: request.actorId,
      createdAt: updatedAt,
    })
    await this.operations.add({
      caseId: request.caseId,
      actorId: request.actorId,
      operationId: request.operationId,
      kind: 'waiver',
      fingerprint,
      result,
      createdAt: updatedAt,
    })
  }
  private assertCurrentItem(item: CaseChecklistItem, request: Request): void {
    if (
      item.updatedAt.toISOString() !== new Date(request.expectedUpdatedAt).toISOString()
    )
      throw new ConflictError('O item mudou. Atualize o checklist.')
    if (!item.waiver || item.status !== CaseChecklistItemStatus.Waived)
      throw new ConflictError('O requisito não está dispensado.')
  }
}
