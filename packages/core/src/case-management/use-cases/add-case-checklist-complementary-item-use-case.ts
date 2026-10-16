import type { DatetimeProvider, UseCase } from '#shared/interfaces'
import { BadRequestError, ConflictError } from '#shared/domain/errors'
import type { CaseChecklistItem } from '../domain/entities'
import {
  CaseAccessIntent,
  CaseHistoryCategory,
  CaseHistoryKind,
} from '../domain/structures'
import type {
  CaseAccessProvider,
  CaseChecklistItemsRepository,
  CaseCollaboratorsProvider,
  CaseHistoriesRepository,
  CaseHistoryTransactionProvider,
} from '../interfaces'

type Request = {
  caseId: string
  collaboratorId: string
  templateItemKey: string
  title: string
  isRequired?: boolean
}

export class AddCaseChecklistComplementaryItemUseCase
  implements UseCase<Request, CaseChecklistItem>
{
  constructor(
    private readonly caseChecklistItemsRepository: CaseChecklistItemsRepository,
    private readonly caseAccessProvider: CaseAccessProvider,
    private readonly histories?: CaseHistoriesRepository,
    private readonly transaction?: CaseHistoryTransactionProvider,
    private readonly collaborators?: CaseCollaboratorsProvider,
    private readonly datetime?: DatetimeProvider,
  ) {}

  async execute(request: Request): Promise<CaseChecklistItem> {
    if (!this.transaction) return this.addItem(request)
    return this.transaction.runInTransaction(() => this.addItem(request))
  }

  private async addItem(request: Request): Promise<CaseChecklistItem> {
    await this.caseAccessProvider.authorize({
      caseId: request.caseId,
      actorId: request.collaboratorId,
      intent: CaseAccessIntent.WriteContent,
    })
    const { title, templateItemKey } = this.normalizeItem(request)
    const previous = await this.findPrevious(
      request.caseId,
      templateItemKey,
      title,
      request.isRequired ?? true,
    )
    if (previous) return previous
    return this.insertItem(request, templateItemKey, title)
  }

  private async insertItem(
    request: Request,
    templateItemKey: string,
    title: string,
  ): Promise<CaseChecklistItem> {
    const [item] = await this.caseChecklistItemsRepository.addMany([
      {
        caseId: request.caseId,
        templateItemKey,
        title,
        isRequired: request.isRequired ?? true,
      },
    ])
    if (!item) {
      const replay = await this.findPrevious(
        request.caseId,
        templateItemKey,
        title,
        request.isRequired ?? true,
      )
      if (replay) return replay
      throw new ConflictError(
        'Não foi possível confirmar a inclusão do item. Tente novamente.',
      )
    }
    await this.recordAddition(request, item, title)
    return item
  }

  private normalizeItem(request: Request): { title: string; templateItemKey: string } {
    const title = request.title.trim()
    const key = request.templateItemKey.trim()
    if (!title || !key) {
      throw new BadRequestError('Informe o nome do item e uma chave de operação válida.')
    }
    const templateItemKey = `manual-item:${request.collaboratorId}:${key}`
    return { title, templateItemKey }
  }

  private async findPrevious(
    caseId: string,
    templateItemKey: string,
    title: string,
    isRequired: boolean,
  ): Promise<CaseChecklistItem | undefined> {
    const previous = (await this.caseChecklistItemsRepository.listByCaseId(caseId)).find(
      (item) => item.templateItemKey === templateItemKey,
    )
    if (previous && (previous.title !== title || previous.isRequired !== isRequired)) {
      throw new ConflictError('A operação já foi usada para outro item do checklist.')
    }
    return previous
  }

  private async recordAddition(request: Request, item: CaseChecklistItem, title: string) {
    if (!this.histories || !this.collaborators || !this.datetime) return
    const actor = await this.collaborators.findById(request.collaboratorId)
    const now = this.datetime.now()
    await this.histories.add({
      caseId: request.caseId,
      kind: CaseHistoryKind.ChecklistItemAdded,
      category: CaseHistoryCategory.Documents,
      occurredAt: now,
      recordedAt: now,
      actorId: request.collaboratorId,
      actorName: actor?.professionalName,
      title: 'Item adicionado ao checklist',
      description: title,
      documents: [],
      details: {
        checklistItemId: item.id,
        title,
        isRequired: item.isRequired,
      },
      sourceKey: `checklist-item-added:${item.id}`,
    })
  }
}
