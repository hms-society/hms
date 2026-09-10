import type { UseCase } from '#shared/interfaces/use-case'

import type { CaseChecklistItem } from '../domain/entities'
import { LegalCaseNotFoundError } from '../domain/errors'
import type {
  CaseChecklistItemsRepository,
  ChecklistTemplateItemsRepository,
  ChecklistTemplatesRepository,
  LegalCasesRepository,
} from '../interfaces'

type Request = {
  caseId: string
  collaboratorId: string
}

export class ListCaseChecklistUseCase
  implements UseCase<Request, readonly CaseChecklistItem[]>
{
  constructor(
    private readonly legalCasesRepository: LegalCasesRepository,
    private readonly caseChecklistItemsRepository: CaseChecklistItemsRepository,
    private readonly checklistTemplatesRepository: ChecklistTemplatesRepository,
    private readonly checklistTemplateItemsRepository: ChecklistTemplateItemsRepository,
  ) {}

  async execute(request: Request): Promise<readonly CaseChecklistItem[]> {
    const assignedCases = await this.legalCasesRepository.listByTeamMember(
      request.collaboratorId,
    )
    const canAccessChecklist = assignedCases.some(
      (assignedCase) => assignedCase.id === request.caseId,
    )

    if (!canAccessChecklist) {
      throw new LegalCaseNotFoundError()
    }

    const legalCase = await this.legalCasesRepository.findById(request.caseId)

    if (!legalCase) {
      throw new LegalCaseNotFoundError()
    }

    const checklistItems = await this.caseChecklistItemsRepository.listByCaseId(
      request.caseId,
    )
    const checklistTemplate = await this.checklistTemplatesRepository.findByLegalAreaId(
      legalCase.legalAreaId,
    )

    if (!checklistTemplate?.isActive) {
      return checklistItems
    }

    const templateItems = await this.checklistTemplateItemsRepository.listByTemplateIds([
      checklistTemplate.id,
    ])

    if (templateItems.length === 0) {
      return checklistItems
    }

    if (
      checklistItems.length > 0 &&
      (!canReplaceChecklist(checklistItems) ||
        hasSameTemplateItems(checklistItems, templateItems))
    ) {
      return checklistItems
    }

    return this.caseChecklistItemsRepository.replaceForCase(
      request.caseId,
      templateItems.map((templateItem) => ({
        templateItemKey: templateItem.id,
        title: templateItem.title,
        isRequired: templateItem.isRequired,
      })),
    )
  }
}

function canReplaceChecklist(checklistItems: readonly CaseChecklistItem[]) {
  return checklistItems.every(
    (item) => !item.documentFileId && !item.validatedAt && !item.validatedBy,
  )
}

function hasSameTemplateItems(
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
