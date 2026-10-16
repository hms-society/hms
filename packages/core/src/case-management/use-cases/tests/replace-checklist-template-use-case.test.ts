import { beforeEach, describe, expect, it } from 'vitest'
import { mock } from 'vitest-mock-extended'
import type { ChecklistTemplate, ChecklistTemplateItem } from '../../domain/entities'
import { ChecklistDocumentType } from '../../domain/structures'
import type {
  ChecklistTemplateItemsRepository,
  ChecklistTemplatesRepository,
} from '../../interfaces'
import { ReplaceChecklistTemplateUseCase } from '../replace-checklist-template-use-case'

describe('Replace Checklist Template Use Case', () => {
  let templates: ReturnType<typeof mock<ChecklistTemplatesRepository>>
  let items: ReturnType<typeof mock<ChecklistTemplateItemsRepository>>
  let useCase: ReplaceChecklistTemplateUseCase

  beforeEach(() => {
    templates = mock<ChecklistTemplatesRepository>()
    items = mock<ChecklistTemplateItemsRepository>()
    useCase = new ReplaceChecklistTemplateUseCase(templates, items)
  })

  it('updates an existing template and normalizes document types and item titles', async () => {
    const template = makeTemplate({ id: 'template-existing' })
    const savedItems: ChecklistTemplateItem[] = []
    templates.replace.mockResolvedValue(template)
    items.replaceForTemplate.mockResolvedValue(savedItems)

    await expect(
      useCase.execute({
        checklistTemplateId: template.id,
        legalAreaId: template.legalAreaId,
        name: '  Template atualizado  ',
        isActive: true,
        updatedBy: 'actor-1',
        items: [
          {
            title: '  Documento  ',
            documentTypes: [
              ChecklistDocumentType.Any,
              ChecklistDocumentType.Pdf,
              ChecklistDocumentType.Pdf,
            ],
            isRequired: true,
            position: 0,
          },
        ],
      }),
    ).resolves.toEqual({ ...template, items: savedItems })

    expect(templates.findByLegalAreaId).not.toHaveBeenCalled()
    expect(templates.replace).toHaveBeenCalledWith(template.id, {
      legalAreaId: template.legalAreaId,
      name: 'Template atualizado',
      isActive: true,
      updatedBy: 'actor-1',
    })
    expect(items.replaceForTemplate).toHaveBeenCalledWith(template.id, [
      {
        title: 'Documento',
        documentTypes: [ChecklistDocumentType.Any],
        isRequired: true,
        position: 0,
        updatedBy: 'actor-1',
      },
    ])
  })

  it('replaces the area template when no template ID is provided and removes duplicate types', async () => {
    const existing = makeTemplate({ id: 'template-area' })
    templates.findByLegalAreaId.mockResolvedValue(existing)
    templates.replace.mockResolvedValue(existing)
    items.replaceForTemplate.mockResolvedValue([])

    await useCase.execute({
      legalAreaId: existing.legalAreaId,
      name: existing.name,
      isActive: false,
      items: [
        {
          title: 'Arquivo',
          documentTypes: [ChecklistDocumentType.Pdf, ChecklistDocumentType.Pdf],
          isRequired: false,
          position: 0,
        },
      ],
    })

    expect(templates.findByLegalAreaId).toHaveBeenCalledWith(existing.legalAreaId)
    expect(templates.replace).toHaveBeenCalledWith(existing.id, expect.any(Object))
    expect(items.replaceForTemplate).toHaveBeenCalledWith(existing.id, [
      expect.objectContaining({ documentTypes: [ChecklistDocumentType.Pdf] }),
    ])
  })

  it('creates a template when the area has none and rejects an unsuccessful save', async () => {
    templates.findByLegalAreaId.mockResolvedValue(undefined)
    templates.add.mockResolvedValue(makeTemplate({ id: 'template-new' }))
    items.replaceForTemplate.mockResolvedValue([])

    await expect(
      useCase.execute({
        legalAreaId: 'area-new',
        name: 'New template',
        isActive: true,
        items: [],
      }),
    ).resolves.toMatchObject({ id: 'template-new', items: [] })
    expect(templates.add).toHaveBeenCalledWith({
      legalAreaId: 'area-new',
      name: 'New template',
      isActive: true,
      updatedBy: undefined,
    })

    templates.replace.mockResolvedValue(undefined)
    await expect(
      useCase.execute({
        checklistTemplateId: 'missing-template',
        legalAreaId: 'area-new',
        name: 'Updated template',
        isActive: false,
        items: [],
      }),
    ).rejects.toThrow('Template de checklist não encontrado.')
  })
})

function makeTemplate(overrides: Partial<ChecklistTemplate> = {}): ChecklistTemplate {
  const now = new Date('2026-10-01T10:00:00.000Z')
  return {
    id: 'template-1',
    legalAreaId: 'area-1',
    name: 'Template',
    isActive: true,
    items: [],
    updatedAt: now,
    ...overrides,
  }
}
