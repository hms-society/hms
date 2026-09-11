import type { UseCase } from '#shared/interfaces'
import type { ChecklistTemplate } from '../domain/entities'
import type {
  ChecklistTemplateItemsRepository,
  ChecklistTemplatesRepository,
} from '../interfaces'

type Request = undefined

export class ListChecklistTemplatesUseCase
  implements UseCase<Request, readonly ChecklistTemplate[]>
{
  constructor(
    private readonly checklistTemplatesRepository: ChecklistTemplatesRepository,
    private readonly checklistTemplateItemsRepository: ChecklistTemplateItemsRepository,
  ) {}

  async execute(): Promise<readonly ChecklistTemplate[]> {
    const templates = await this.checklistTemplatesRepository.list()
    const items = await this.checklistTemplateItemsRepository.listByTemplateIds(
      templates.map((template) => template.id),
    )

    return templates.map((template) => ({
      ...template,
      items: items.filter((item) => item.checklistTemplateId === template.id),
    }))
  }
}
