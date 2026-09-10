import type { ChecklistTemplate, ChecklistTemplateCreation } from '../domain/entities'

export interface ChecklistTemplatesRepository {
  add(template: ChecklistTemplateCreation): Promise<ChecklistTemplate>
  findByLegalAreaId(legalAreaId: string): Promise<ChecklistTemplate | undefined>
  list(): Promise<readonly ChecklistTemplate[]>
  replace(
    checklistTemplateId: string,
    changes: ChecklistTemplateCreation,
  ): Promise<ChecklistTemplate | undefined>
  removeAll(): Promise<void>
}
