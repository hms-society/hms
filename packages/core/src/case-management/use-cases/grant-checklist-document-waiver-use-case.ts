import type { UseCase, DatetimeProvider } from '#shared/interfaces'
import { BadRequestError, ConflictError, ForbiddenError } from '#shared/domain/errors'
import type { CaseChecklistItem } from '../domain/entities'
import { CaseAccessIntent, CaseChecklistItemStatus } from '../domain/structures'
import type {
  GrantChecklistDocumentWaiverRequest as Request,
  ChecklistDocumentWaiver,
} from '../domain/structures'
import type {
  LegalCasesRepository,
  CaseChecklistItemsRepository,
  CaseAccessProvider,
  CaseCollaboratorsProvider,
  ChecklistDocumentOperationsRepository,
  ChecklistDocumentHistoriesRepository,
  ChecklistDocumentTransactionProvider,
} from '../interfaces'
import { ResolveChecklistDocumentContextUseCase } from './resolve-checklist-document-context-use-case'
export class GrantChecklistDocumentWaiverUseCase
  implements UseCase<Request, CaseChecklistItem>
{
  private readonly context: ResolveChecklistDocumentContextUseCase
  constructor(
    cases: LegalCasesRepository,
    private readonly items: CaseChecklistItemsRepository,
    access: CaseAccessProvider,
    private readonly collaborators: CaseCollaboratorsProvider,
    private readonly operations: ChecklistDocumentOperationsRepository,
    private readonly histories: ChecklistDocumentHistoriesRepository,
    private readonly transaction: ChecklistDocumentTransactionProvider,
    private readonly datetime: DatetimeProvider,
  ) {
    this.context = new ResolveChecklistDocumentContextUseCase(cases, items, access)
  }
  async execute(request: Request): Promise<CaseChecklistItem> {
    const justification = request.justification.trim()
    if (!justification) throw new BadRequestError('Informe a justificativa da dispensa.')
    return this.transaction.runInTransaction(() =>
      this.applyWaiver(request, justification),
    )
  }
  private async applyWaiver(
    request: Request,
    justification: string,
  ): Promise<CaseChecklistItem> {
    const { item } = await this.context.execute({
      ...request,
      write: true,
      intent: CaseAccessIntent.ManageDocumentException,
    })
    const fingerprint = JSON.stringify([
      'grant-checklist-document-waiver',
      request.checklistItemId,
      request.expectedUpdatedAt,
      justification,
    ])
    const previous = await this.operations.find(request)
    if (previous) {
      if (previous.kind !== 'waiver' || previous.fingerprint !== fingerprint)
        throw new ConflictError('A operação foi reutilizada com dados diferentes.')
      return previous.result
    }
    this.assertCurrentItem(item, request)
    const actor = await this.collaborators.findById(request.actorId)
    if (!actor) throw new ForbiddenError('Gestor indisponível.')
    const updatedAt = new Date(
      Math.max(this.datetime.now().getTime(), item.updatedAt.getTime() + 1),
    )
    const waiver = {
      justification,
      actorId: request.actorId,
      actorName: actor.professionalName,
      grantedAt: updatedAt,
    }
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
        status: CaseChecklistItemStatus.Waived,
        waiver: waiver,
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
      action: 'waiver_granted',
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
    if (!item.isRequired)
      throw new BadRequestError('A dispensa se aplica a requisitos obrigatórios.')
    if (
      item.waiver ||
      (item.status !== CaseChecklistItemStatus.Pending &&
        item.status !== CaseChecklistItemStatus.InAnalysis)
    )
      throw new ConflictError('O requisito já está atendido.')
  }
}
