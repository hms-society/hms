import { beforeEach, describe, expect, it } from 'vitest'
import { mock } from 'vitest-mock-extended'
import { CaseChecklistItemFaker, LegalCaseFaker } from '../../domain/entities/fakers'
import type { CaseChecklistItem, ChecklistTemplateItem } from '../../domain/entities'
import { CaseChecklistItemStatus } from '../../domain/structures'
import type {
  CaseAccessProvider,
  CaseChecklistItemsRepository,
  ChecklistTemplateItemsRepository,
  ChecklistTemplatesRepository,
  LegalCasesRepository,
} from '../../interfaces'
import { CaseAccessIntent, LegalCaseStatus } from '../../domain/structures'
import { ForbiddenError } from '#shared/domain/errors/forbidden-error'
import { ListCaseChecklistUseCase } from '../list-case-checklist-use-case'
import { TEST_ACTOR_ID, TEST_CASE_ID } from './case-management-test-fixtures'

describe('List Case Checklist Use Case', () => {
  let cases: ReturnType<typeof mock<LegalCasesRepository>>
  let items: ReturnType<typeof mock<CaseChecklistItemsRepository>>
  let templates: ReturnType<typeof mock<ChecklistTemplatesRepository>>
  let templateItems: ReturnType<typeof mock<ChecklistTemplateItemsRepository>>
  let access: ReturnType<typeof mock<CaseAccessProvider>>
  let useCase: ListCaseChecklistUseCase

  beforeEach(() => {
    cases = mock<LegalCasesRepository>()
    items = mock<CaseChecklistItemsRepository>()
    templates = mock<ChecklistTemplatesRepository>()
    templateItems = mock<ChecklistTemplateItemsRepository>()
    access = mock<CaseAccessProvider>()
    useCase = new ListCaseChecklistUseCase(cases, items, templates, templateItems, access)
  })

  it('checks legal access before reading checklist items', async () => {
    cases.findById.mockResolvedValue(
      LegalCaseFaker.fake({ id: TEST_CASE_ID, clientId: 'client-1' }),
    )
    access.authorize.mockRejectedValue(
      new ForbiddenError('Acesso jurídico ao Caso não autorizado.'),
    )

    await expect(
      useCase.execute({ caseId: TEST_CASE_ID, collaboratorId: TEST_ACTOR_ID }),
    ).rejects.toBeInstanceOf(ForbiddenError)
    expect(access.authorize).toHaveBeenCalledWith({
      caseId: TEST_CASE_ID,
      actorId: TEST_ACTOR_ID,
      intent: CaseAccessIntent.ReadContent,
    })
    expect(items.listByCaseId).not.toHaveBeenCalled()
    expect(items.addMany).not.toHaveBeenCalled()
  })

  it('reads a closed case checklist without synchronizing templates or writing', async () => {
    const checklist: readonly CaseChecklistItem[] = []
    cases.findById.mockResolvedValue(
      LegalCaseFaker.fake({ id: TEST_CASE_ID, status: LegalCaseStatus.Closed }),
    )
    items.listByCaseId.mockResolvedValue(checklist)

    await expect(
      useCase.execute({ caseId: TEST_CASE_ID, collaboratorId: TEST_ACTOR_ID }),
    ).resolves.toBe(checklist)

    expect(access.authorize).toHaveBeenCalledWith({
      caseId: TEST_CASE_ID,
      actorId: TEST_ACTOR_ID,
      intent: CaseAccessIntent.ReadContent,
    })
    expect(templates.findByLegalAreaId).not.toHaveBeenCalled()
    expect(templateItems.listByTemplateIds).not.toHaveBeenCalled()
    expect(items.addMany).not.toHaveBeenCalled()
    expect(items.replaceForCase).not.toHaveBeenCalled()
  })

  it('rejects a missing case and a client that does not own the case', async () => {
    cases.findById.mockResolvedValue(undefined)
    await expect(
      useCase.execute({ caseId: TEST_CASE_ID, collaboratorId: TEST_ACTOR_ID }),
    ).rejects.toThrow('O caso não foi encontrado.')

    cases.findById.mockResolvedValue(LegalCaseFaker.fake({ id: TEST_CASE_ID }))
    await expect(
      useCase.execute({
        caseId: TEST_CASE_ID,
        collaboratorId: TEST_ACTOR_ID,
        clientId: 'different-client',
      }),
    ).rejects.toThrow('O caso não foi encontrado.')
    expect(access.authorize).not.toHaveBeenCalled()
  })

  it('retains a waived requirement when templates change instead of rebuilding its identity', async () => {
    const waiver = {
      justification: 'Unavailable',
      actorId: TEST_ACTOR_ID,
      actorName: 'Manager',
      grantedAt: new Date('2026-10-13T12:00:00Z'),
    }
    const waived = CaseChecklistItemFaker.fake({
      caseId: TEST_CASE_ID,
      status: CaseChecklistItemStatus.Waived,
      waiver,
    })
    cases.findById.mockResolvedValue(
      LegalCaseFaker.fake({ id: TEST_CASE_ID, legalAreaId: 'area-1' }),
    )
    items.listByCaseId.mockResolvedValue([waived])
    templates.findByLegalAreaId.mockResolvedValue({
      id: 'template-1',
      name: 'Current',
      legalAreaId: 'area-1',
      isActive: true,
      items: [],
      updatedAt: new Date('2026-10-13T12:00:00Z'),
    })
    templateItems.listByTemplateIds.mockResolvedValue([
      { id: 'new-requirement', title: 'Current requirement', isRequired: true } as never,
    ])
    await useCase.execute({ caseId: TEST_CASE_ID, collaboratorId: TEST_ACTOR_ID })
    expect(items.replaceForCase).not.toHaveBeenCalled()
    expect(items.addMany).toHaveBeenCalled()
    expect(waived.waiver).toEqual(waiver)
  })
  it('uses the client ownership path and returns items when there is no active template', async () => {
    const checklist = [makeChecklistItem()]
    cases.findById.mockResolvedValue(
      LegalCaseFaker.fake({
        id: TEST_CASE_ID,
        clientId: 'client-1',
        legalAreaId: 'area-1',
      }),
    )
    items.listByCaseId.mockResolvedValue(checklist)
    templates.findByLegalAreaId.mockResolvedValue({
      id: 'template-1',
      legalAreaId: 'area-1',
      isActive: false,
      name: 'Inactive template',
      items: [],
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    })

    await expect(
      useCase.execute({
        caseId: TEST_CASE_ID,
        collaboratorId: TEST_ACTOR_ID,
        clientId: 'client-1',
      }),
    ).resolves.toBe(checklist)

    expect(access.authorize).not.toHaveBeenCalled()
    expect(templates.findByLegalAreaId).toHaveBeenCalledWith('area-1')
    expect(templateItems.listByTemplateIds).not.toHaveBeenCalled()
  })

  it('returns existing checklist items when an active template has no items', async () => {
    const checklist = [makeChecklistItem()]
    cases.findById.mockResolvedValue(LegalCaseFaker.fake({ id: TEST_CASE_ID }))
    items.listByCaseId.mockResolvedValue(checklist)
    templates.findByLegalAreaId.mockResolvedValue({
      id: 'template-1',
      legalAreaId: 'area-1',
      isActive: true,
      name: 'Template',
      items: [],
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    })
    templateItems.listByTemplateIds.mockResolvedValue([])

    await expect(
      useCase.execute({ caseId: TEST_CASE_ID, collaboratorId: TEST_ACTOR_ID }),
    ).resolves.toBe(checklist)

    expect(templateItems.listByTemplateIds).toHaveBeenCalledWith(['template-1'])
    expect(items.replaceForCase).not.toHaveBeenCalled()
  })

  it('replaces an empty checklist with the active template items', async () => {
    const templateItemsList: ChecklistTemplateItem[] = [
      {
        id: 'template-item-1',
        checklistTemplateId: 'template-1',
        title: 'Procuração',
        documentTypes: [],
        isRequired: true,
        position: 0,
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    ]
    const replacement = [makeChecklistItem({ templateItemKey: 'template-item-1' })]
    cases.findById.mockResolvedValue(LegalCaseFaker.fake({ id: TEST_CASE_ID }))
    items.listByCaseId.mockResolvedValue([])
    templates.findByLegalAreaId.mockResolvedValue({
      id: 'template-1',
      legalAreaId: 'area-1',
      isActive: true,
      name: 'Template',
      items: [],
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    })
    templateItems.listByTemplateIds.mockResolvedValue(templateItemsList)
    items.replaceForCase.mockResolvedValue(replacement)

    await expect(
      useCase.execute({ caseId: TEST_CASE_ID, collaboratorId: TEST_ACTOR_ID }),
    ).resolves.toBe(replacement)
    expect(items.replaceForCase).toHaveBeenCalledWith(TEST_CASE_ID, [
      { templateItemKey: 'template-item-1', title: 'Procuração', isRequired: true },
    ])
  })

  it('adds only missing template items when checklist entries are already in use', async () => {
    const existing = makeChecklistItem({
      documentFileId: 'document-1',
      title: 'Procuração',
    })
    const refreshed = [
      existing,
      makeChecklistItem({
        id: 'item-2',
        templateItemKey: 'template-item-2',
        title: 'Comprovante',
      }),
    ]
    cases.findById.mockResolvedValue(LegalCaseFaker.fake({ id: TEST_CASE_ID }))
    items.listByCaseId.mockResolvedValueOnce([existing]).mockResolvedValueOnce(refreshed)
    templates.findByLegalAreaId.mockResolvedValue({
      id: 'template-1',
      legalAreaId: 'area-1',
      isActive: true,
      name: 'Template',
      items: [],
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    })
    templateItems.listByTemplateIds.mockResolvedValue([
      {
        id: existing.templateItemKey,
        checklistTemplateId: 'template-1',
        title: ' Procuração ',
        documentTypes: [],
        isRequired: true,
        position: 0,
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
      {
        id: 'template-item-2',
        checklistTemplateId: 'template-1',
        title: 'Comprovante',
        documentTypes: [],
        isRequired: false,
        position: 1,
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    ])
    items.addMany.mockResolvedValue(refreshed)

    await expect(
      useCase.execute({ caseId: TEST_CASE_ID, collaboratorId: TEST_ACTOR_ID }),
    ).resolves.toBe(refreshed)

    expect(items.addMany).toHaveBeenCalledWith([
      {
        caseId: TEST_CASE_ID,
        templateItemKey: 'template-item-2',
        title: 'Comprovante',
        isRequired: false,
      },
    ])
    expect(items.replaceForCase).not.toHaveBeenCalled()
  })

  it('keeps the current checklist when it already matches the active template', async () => {
    const current = [
      makeChecklistItem({ templateItemKey: 'template-item-1', title: 'Procuração' }),
    ]
    cases.findById.mockResolvedValue(LegalCaseFaker.fake({ id: TEST_CASE_ID }))
    items.listByCaseId.mockResolvedValue(current)
    templates.findByLegalAreaId.mockResolvedValue({
      id: 'template-1',
      legalAreaId: 'area-1',
      isActive: true,
      name: 'Template',
      items: [],
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    })
    templateItems.listByTemplateIds.mockResolvedValue([
      {
        id: 'template-item-1',
        checklistTemplateId: 'template-1',
        title: 'Procuração',
        documentTypes: [],
        isRequired: true,
        position: 0,
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    ])

    await expect(
      useCase.execute({ caseId: TEST_CASE_ID, collaboratorId: TEST_ACTOR_ID }),
    ).resolves.toBe(current)
    expect(items.replaceForCase).not.toHaveBeenCalled()
    expect(items.addMany).not.toHaveBeenCalled()
  })
  it.each([
    { templateItemKey: `manual-item:${TEST_ACTOR_ID}:new-item`, isRequired: true },
    { templateItemKey: 'complementary-legacy-item', isRequired: false },
  ])('preserves a manually added $templateItemKey when existing template items are all unreceived', async ({
    templateItemKey,
    isRequired,
  }) => {
    const manual = CaseChecklistItemFaker.fake({
      caseId: TEST_CASE_ID,
      templateItemKey,
      title: 'Certidão adicional',
      isRequired,
      status: CaseChecklistItemStatus.Pending,
    })
    const templateItem = CaseChecklistItemFaker.fake({
      caseId: TEST_CASE_ID,
      templateItemKey: 'template-item-1',
      title: 'Procuração',
      status: CaseChecklistItemStatus.Pending,
    })
    const current = [templateItem, manual]
    cases.findById.mockResolvedValue(LegalCaseFaker.fake({ id: TEST_CASE_ID }))
    items.listByCaseId.mockResolvedValue(current)
    templates.findByLegalAreaId.mockResolvedValue({
      id: 'template-1',
      name: 'Current',
      legalAreaId: 'area-1',
      isActive: true,
      items: [],
      updatedAt: new Date('2026-10-13T12:00:00Z'),
    })
    templateItems.listByTemplateIds.mockResolvedValue([
      {
        id: templateItem.templateItemKey,
        checklistTemplateId: 'template-1',
        title: templateItem.title,
        documentTypes: [],
        isRequired: true,
        position: 0,
        updatedAt: new Date('2026-10-13T12:00:00Z'),
      },
    ])
    expect(
      await useCase.execute({ caseId: TEST_CASE_ID, collaboratorId: TEST_ACTOR_ID }),
    ).toBe(current)
    expect(current[1]).toEqual(manual)
    expect(manual).toMatchObject({
      templateItemKey,
      title: 'Certidão adicional',
      isRequired,
      status: CaseChecklistItemStatus.Pending,
    })
    expect(items.replaceForCase).not.toHaveBeenCalled()
    expect(items.addMany).not.toHaveBeenCalled()
  })

  it.each([
    { templateItemKey: `manual-item:${TEST_ACTOR_ID}:first-item`, isRequired: true },
    { templateItemKey: 'complementary-legacy-first', isRequired: false },
  ])('preserves $templateItemKey added before the first checklist fetch and adds missing template items', async ({
    templateItemKey,
    isRequired,
  }) => {
    const manual = CaseChecklistItemFaker.fake({
      caseId: TEST_CASE_ID,
      templateItemKey,
      title: 'Documento adicional',
      isRequired,
      status: CaseChecklistItemStatus.Pending,
    })
    const templateItem = CaseChecklistItemFaker.fake({
      caseId: TEST_CASE_ID,
      templateItemKey: 'template-item-1',
      title: 'Procuração',
      status: CaseChecklistItemStatus.Pending,
    })
    const refreshed = [manual, templateItem]
    cases.findById.mockResolvedValue(LegalCaseFaker.fake({ id: TEST_CASE_ID }))
    items.listByCaseId.mockResolvedValueOnce([manual]).mockResolvedValueOnce(refreshed)
    templates.findByLegalAreaId.mockResolvedValue({
      id: 'template-1',
      name: 'Current',
      legalAreaId: 'area-1',
      isActive: true,
      items: [],
      updatedAt: new Date('2026-10-13T12:00:00Z'),
    })
    templateItems.listByTemplateIds.mockResolvedValue([
      {
        id: templateItem.templateItemKey,
        checklistTemplateId: 'template-1',
        title: templateItem.title,
        documentTypes: [],
        isRequired: true,
        position: 0,
        updatedAt: new Date('2026-10-13T12:00:00Z'),
      },
    ])
    expect(
      await useCase.execute({ caseId: TEST_CASE_ID, collaboratorId: TEST_ACTOR_ID }),
    ).toBe(refreshed)
    expect(refreshed[0]).toBe(manual)
    expect(manual).toMatchObject({
      templateItemKey,
      title: 'Documento adicional',
      isRequired,
      status: CaseChecklistItemStatus.Pending,
    })
    expect(items.replaceForCase).not.toHaveBeenCalled()
    expect(items.addMany).toHaveBeenCalledWith([
      {
        caseId: TEST_CASE_ID,
        templateItemKey: templateItem.templateItemKey,
        title: 'Procuração',
        isRequired: true,
      },
    ])
  })

  it('preserves a generated immutable reference during template synchronization', async () => {
    const item = CaseChecklistItemFaker.fake({
      caseId: TEST_CASE_ID,
      documentReference: {
        clientDocumentId: 'client-source',
        source: {
          kind: 'consultation_version',
          consultationId: 'consultation',
          documentId: 'document',
          versionId: 'version',
        },
        attachedAt: new Date('2026-10-12T12:00:00Z'),
        attachedBy: TEST_ACTOR_ID,
      },
    })
    cases.findById.mockResolvedValue(
      LegalCaseFaker.fake({ id: TEST_CASE_ID, legalAreaId: 'area' }),
    )
    items.listByCaseId.mockResolvedValue([item])
    templates.findByLegalAreaId.mockResolvedValue({
      id: 'template',
      legalAreaId: 'area',
      isActive: true,
      name: 'Template',
      items: [],
      updatedAt: new Date('2026-10-12T12:00:00Z'),
    })
    templateItems.listByTemplateIds.mockResolvedValue([
      {
        id: item.templateItemKey,
        checklistTemplateId: 'template',
        title: item.title,
        documentTypes: [],
        isRequired: true,
        position: 0,
        updatedAt: new Date('2026-10-12T12:00:00Z'),
      },
    ])
    await expect(
      useCase.execute({ caseId: TEST_CASE_ID, collaboratorId: TEST_ACTOR_ID }),
    ).resolves.toEqual([item])
    expect(items.replaceForCase).not.toHaveBeenCalled()
  })
})

function makeChecklistItem(
  overrides: Partial<CaseChecklistItem> = {},
): CaseChecklistItem {
  const now = new Date('2026-10-01T10:00:00.000Z')
  return {
    id: 'item-1',
    caseId: TEST_CASE_ID,
    templateItemKey: 'template-item-1',
    title: 'Procuração',
    isRequired: true,
    status: CaseChecklistItemStatus.Pending,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}
