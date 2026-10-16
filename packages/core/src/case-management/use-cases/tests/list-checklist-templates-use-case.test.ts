import { beforeEach, describe, expect, it } from 'vitest'
import { mock } from 'vitest-mock-extended'
import type { ChecklistTemplate, ChecklistTemplateItem } from '../../domain/entities'
import type {
  ChecklistTemplateItemsRepository,
  ChecklistTemplatesRepository,
} from '../../interfaces'
import { ListChecklistTemplatesUseCase } from '../list-checklist-templates-use-case'

describe('List Checklist Templates Use Case', () => {
  let templates: ReturnType<typeof mock<ChecklistTemplatesRepository>>
  let items: ReturnType<typeof mock<ChecklistTemplateItemsRepository>>
  let useCase: ListChecklistTemplatesUseCase

  beforeEach(() => {
    templates = mock<ChecklistTemplatesRepository>()
    items = mock<ChecklistTemplateItemsRepository>()
    useCase = new ListChecklistTemplatesUseCase(templates, items)
  })

  it('projects each template with only its own items', async () => {
    const timestamp = new Date('2026-10-01T10:00:00.000Z')
    const templateA: ChecklistTemplate = {
      id: 'template-a',
      legalAreaId: 'area-a',
      name: 'Area A',
      isActive: true,
      items: [],
      updatedAt: timestamp,
    }
    const templateB: ChecklistTemplate = {
      id: 'template-b',
      legalAreaId: 'area-b',
      name: 'Area B',
      isActive: false,
      items: [],
      updatedAt: timestamp,
    }
    const itemA: ChecklistTemplateItem = {
      id: 'item-a',
      checklistTemplateId: templateA.id,
      title: 'Procuração',
      documentTypes: [],
      isRequired: true,
      position: 0,
      updatedAt: timestamp,
    }
    const itemB: ChecklistTemplateItem = {
      id: 'item-b',
      checklistTemplateId: templateB.id,
      title: 'Comprovante',
      documentTypes: [],
      isRequired: false,
      position: 0,
      updatedAt: timestamp,
    }
    templates.list.mockResolvedValue([templateA, templateB])
    items.listByTemplateIds.mockResolvedValue([itemA, itemB])

    await expect(useCase.execute()).resolves.toEqual([
      { ...templateA, items: [itemA] },
      { ...templateB, items: [itemB] },
    ])
    expect(items.listByTemplateIds).toHaveBeenCalledWith(['template-a', 'template-b'])
  })

  it('returns no templates when the repository is empty', async () => {
    templates.list.mockResolvedValue([])
    items.listByTemplateIds.mockResolvedValue([])

    await expect(useCase.execute()).resolves.toEqual([])
    expect(items.listByTemplateIds).toHaveBeenCalledWith([])
  })
})
