import type {
  ChecklistTemplateItem,
  ChecklistTemplateItemCreation,
} from '../domain/entities'

export interface ChecklistTemplateItemsRepository {
  addMany(
    checklistTemplateItems: readonly ChecklistTemplateItemCreation[],
  ): Promise<readonly ChecklistTemplateItem[]>
  listByTemplateIds(
    checklistTemplateIds: readonly string[],
  ): Promise<readonly ChecklistTemplateItem[]>
  replaceForTemplate(
    checklistTemplateId: string,
    checklistTemplateItems: readonly Omit<
      ChecklistTemplateItemCreation,
      'checklistTemplateId'
    >[],
  ): Promise<readonly ChecklistTemplateItem[]>
  removeAll(): Promise<void>
}
