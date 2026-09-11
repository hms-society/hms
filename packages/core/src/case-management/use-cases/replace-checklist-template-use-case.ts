import type { UseCase } from '#shared/interfaces'
import { ChecklistTemplateNotFoundError } from '../domain/errors'
import type { ChecklistTemplate } from '../domain/entities'
import {
  ChecklistDocumentType,
  type ChecklistDocumentType as ChecklistDocumentTypeValue,
} from '../domain/structures'
import type {
  ChecklistTemplateItemsRepository,
  ChecklistTemplatesRepository,
} from '../interfaces'

type Request = {
  checklistTemplateId?: string
  legalAreaId: string
  name: string
  isActive: boolean
  updatedBy?: string
  items: readonly {
    title: string
    documentTypes: readonly ChecklistDocumentTypeValue[]
    isRequired: boolean
    position: number
  }[]
}

export class ReplaceChecklistTemplateUseCase
  implements UseCase<Request, ChecklistTemplate>
{
  constructor(
    private readonly checklistTemplatesRepository: ChecklistTemplatesRepository,
    private readonly checklistTemplateItemsRepository: ChecklistTemplateItemsRepository,
  ) {}

  async execute(request: Request): Promise<ChecklistTemplate> {
    const templateChanges = {
      legalAreaId: request.legalAreaId,
      name: request.name.trim(),
      isActive: request.isActive,
      updatedBy: request.updatedBy,
    }
    const existingTemplate = request.checklistTemplateId
      ? undefined
      : await this.checklistTemplatesRepository.findByLegalAreaId(request.legalAreaId)
    const templateId = request.checklistTemplateId ?? existingTemplate?.id
    const template = templateId
      ? await this.checklistTemplatesRepository.replace(templateId, templateChanges)
      : await this.checklistTemplatesRepository.add(templateChanges)

    if (!template) {
      throw new ChecklistTemplateNotFoundError()
    }

    const items = await this.checklistTemplateItemsRepository.replaceForTemplate(
      template.id,
      request.items.map((item, index) => ({
        title: item.title.trim(),
        documentTypes: normalizeDocumentTypes(item.documentTypes),
        isRequired: item.isRequired,
        position: item.position ?? index,
        updatedBy: request.updatedBy,
      })),
    )

    return {
      ...template,
      items,
    }
  }
}

function normalizeDocumentTypes(
  documentTypes: readonly ChecklistDocumentTypeValue[],
): readonly ChecklistDocumentTypeValue[] {
  if (documentTypes.includes(ChecklistDocumentType.Any)) {
    return [ChecklistDocumentType.Any]
  }

  return [...new Set(documentTypes)]
}
