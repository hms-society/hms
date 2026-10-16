import type { UseCase } from '#shared/interfaces/use-case'

import type { CaseChecklistItem } from '../domain/entities'
import { LegalCaseNotFoundError } from '../domain/errors'
import type {
  CaseChecklistItemsRepository,
  ChecklistTemplateItemsRepository,
  ChecklistTemplatesRepository,
  LegalCasesRepository,
} from '../interfaces'
import type { CaseAccessProvider } from '../interfaces'
import { CaseAccessIntent, LegalCaseStatus } from '../domain/structures'

type Request = {
  caseId: string
  collaboratorId: string
  clientId?: string
}

export class ListCaseChecklistUseCase
  implements UseCase<Request, readonly CaseChecklistItem[]>
{
  constructor(
    private readonly legalCasesRepository: LegalCasesRepository,
    private readonly caseChecklistItemsRepository: CaseChecklistItemsRepository,
    private readonly checklistTemplatesRepository: ChecklistTemplatesRepository,
    private readonly checklistTemplateItemsRepository: ChecklistTemplateItemsRepository,
    private readonly caseAccessProvider: CaseAccessProvider,
  ) {}

  async execute(request: Request): Promise<readonly CaseChecklistItem[]> {
    const legalCase = await this.findAuthorizedCase(request)
    const checklistItems = await this.caseChecklistItemsRepository.listByCaseId(
      request.caseId,
    )
    if (legalCase.status === LegalCaseStatus.Closed) return checklistItems
    const checklistTemplate = await this.checklistTemplatesRepository.findByLegalAreaId(
      legalCase.legalAreaId,
    )
    if (!checklistTemplate?.isActive) return checklistItems
    const templateItems = await this.checklistTemplateItemsRepository.listByTemplateIds([
      checklistTemplate.id,
    ])
    if (templateItems.length === 0) return checklistItems
    return this.synchronizeTemplate(request.caseId, checklistItems, templateItems)
  }

  private async findAuthorizedCase(request: Request) {
    const legalCase = await this.legalCasesRepository.findById(request.caseId)
    if (!legalCase) throw new LegalCaseNotFoundError()
    if (request.clientId) {
      if (legalCase.clientId !== request.clientId) throw new LegalCaseNotFoundError()
    } else {
      await this.caseAccessProvider.authorize({
        caseId: request.caseId,
        actorId: request.collaboratorId,
        intent: CaseAccessIntent.ReadContent,
      })
    }
    return legalCase
  }

  private async synchronizeTemplate(
    caseId: string,
    checklistItems: readonly CaseChecklistItem[],
    templateItems: readonly { id: string; title: string; isRequired: boolean }[],
  ): Promise<readonly CaseChecklistItem[]> {
    if (checklistItems.length > 0 && !this.canReplaceChecklist(checklistItems)) {
      return this.addMissingTemplateItems(caseId, checklistItems, templateItems)
    }
    if (this.hasSameTemplateItems(checklistItems, templateItems)) return checklistItems
    return this.caseChecklistItemsRepository.replaceForCase(
      caseId,
      templateItems.map(({ id, title, isRequired }) => ({
        templateItemKey: id,
        title,
        isRequired,
      })),
    )
  }

  private async addMissingTemplateItems(
    caseId: string,
    checklistItems: readonly CaseChecklistItem[],
    templateItems: readonly { id: string; title: string; isRequired: boolean }[],
  ): Promise<readonly CaseChecklistItem[]> {
    const existingKeys = new Set(checklistItems.map((item) => item.templateItemKey))
    const existingTitles = new Set(
      checklistItems.map((item) => item.title.trim().toLowerCase()),
    )
    const missing = templateItems.filter(
      (item) =>
        !existingKeys.has(item.id) &&
        !existingTitles.has(item.title.trim().toLowerCase()),
    )
    if (missing.length === 0) return checklistItems
    await this.caseChecklistItemsRepository.addMany(
      missing.map((item) => ({
        caseId,
        templateItemKey: item.id,
        title: item.title,
        isRequired: item.isRequired,
      })),
    )
    return this.caseChecklistItemsRepository.listByCaseId(caseId)
  }

  private canReplaceChecklist(checklistItems: readonly CaseChecklistItem[]) {
    return checklistItems.every(
      (item) =>
        !item.templateItemKey.startsWith('manual-item:') &&
        !item.templateItemKey.startsWith('complementary-') &&
        !item.documentFileId &&
        !item.documentReference &&
        !item.waiver &&
        !item.validatedAt &&
        !item.validatedBy,
    )
  }

  private hasSameTemplateItems(
    checklistItems: readonly CaseChecklistItem[],
    templateItems: readonly { id: string; title: string; isRequired: boolean }[],
  ) {
    if (checklistItems.length !== templateItems.length) {
      return false
    }

    return templateItems.every((templateItem, index) => {
      const checklistItem = checklistItems[index]

      return (
        checklistItem?.templateItemKey === templateItem.id &&
        checklistItem.title === templateItem.title &&
        checklistItem.isRequired === templateItem.isRequired
      )
    })
  }
}
