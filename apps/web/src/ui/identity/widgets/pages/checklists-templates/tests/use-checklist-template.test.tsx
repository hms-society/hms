import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ChecklistDocumentType } from '@hms/core/case-management/domain/structures'
import type { ChecklistTemplate } from '@hms/core/case-management/domain/entities'
import type { LegalArea } from '@hms/core/legal-catalog/domain/entities'
import { RestResponse } from '@hms/core/shared/responses/rest-response'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { useChecklistsTemplates } from '../use-checklist-template'

vi.mock('@/ui/shared/hooks/use-rest-context', () => ({ useRestContext: vi.fn() }))

const useRestContextMock = vi.mocked(useRestContext)

describe('useChecklistsTemplates', () => {
  const legalAreasService = { listLegalAreas: vi.fn() }
  const caseManagementService = {
    listChecklistTemplates: vi.fn(),
    replaceChecklistTemplate: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    legalAreasService.listLegalAreas.mockResolvedValue(
      new RestResponse({
        body: [legalArea('civil', 'Cível'), legalArea('labor', 'Trabalhista')],
      }),
    )
    caseManagementService.listChecklistTemplates.mockResolvedValue(
      new RestResponse({
        body: [
          checklistTemplate('template-civil', 'civil', [
            checklistItem('item-id', 'Procuração', [ChecklistDocumentType.Pdf], true, 0),
            checklistItem('item-any', 'Documento geral', ['invalid'], false, 1),
          ]),
        ],
      }),
    )
    caseManagementService.replaceChecklistTemplate.mockResolvedValue(
      new RestResponse({ body: checklistTemplate('template-civil', 'civil', []) }),
    )
    useRestContextMock.mockReturnValue({
      legalCatalogService: legalAreasService,
      caseManagementService,
    } as unknown as ReturnType<typeof useRestContext>)
  })

  it('hydrates templates, chooses a valid initial area, normalizes types and filters documents', async () => {
    const { result } = renderHook(() => useChecklistsTemplates('labor'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.activeAreaId).toBe('labor')
      expect(result.current.areas).toHaveLength(2)
    })
    expect(result.current.areas).toEqual([
      { id: 'civil', name: 'Cível', documentCount: 2, templateId: 'template-civil' },
      { id: 'labor', name: 'Trabalhista', documentCount: 0, templateId: undefined },
    ])

    act(() => result.current.setActiveAreaId('civil'))
    await waitFor(() => expect(result.current.documents).toHaveLength(2))
    expect(result.current.documents[1].types).toEqual([ChecklistDocumentType.Any])
    act(() => result.current.setSearch('  procura  '))
    expect(result.current.documents.map((document) => document.name)).toEqual([
      'Procuração',
    ])
  })

  it('settles from undefined query data while both requests are pending', async () => {
    let resolveLegalAreas!: (response: RestResponse<readonly LegalArea[]>) => void
    let resolveTemplates!: (response: RestResponse<readonly ChecklistTemplate[]>) => void
    legalAreasService.listLegalAreas.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveLegalAreas = resolve
      }),
    )
    caseManagementService.listChecklistTemplates.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveTemplates = resolve
      }),
    )

    const { result } = renderHook(() => useChecklistsTemplates(), {
      wrapper: createWrapper(),
    })
    expect(result.current.isLoading).toBe(true)

    await act(async () => {
      resolveLegalAreas(new RestResponse({ body: [legalArea('civil', 'Cível')] }))
      resolveTemplates(new RestResponse({ body: [] }))
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.activeArea?.id).toBe('civil')
    expect(result.current.documents).toEqual([])
  })

  it('adds, updates, removes, and saves the active area template payload', async () => {
    const { result } = renderHook(() => useChecklistsTemplates(), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.documents).toHaveLength(2))

    act(() => {
      result.current.toggleRequired('item-id')
      result.current.changeDocumentType('item-id', ChecklistDocumentType.Pdf)
      result.current.changeDocumentType('item-id', ChecklistDocumentType.Docx)
      result.current.addDocument('Novo documento', [ChecklistDocumentType.Image], false)
    })
    expect(result.current.documents[0]).toMatchObject({
      id: 'item-id',
      required: false,
      types: [ChecklistDocumentType.Docx],
    })
    expect(result.current.documents).toHaveLength(3)

    act(() => result.current.removeDocument('item-any'))
    await act(async () => result.current.saveTemplate())

    expect(caseManagementService.replaceChecklistTemplate).toHaveBeenCalledWith({
      checklistTemplateId: 'template-civil',
      legalAreaId: 'civil',
      name: 'Cível',
      isActive: true,
      items: [
        {
          title: 'Procuração',
          documentTypes: [ChecklistDocumentType.Docx],
          isRequired: false,
          position: 0,
        },
        {
          title: 'Novo documento',
          documentTypes: [ChecklistDocumentType.Image],
          isRequired: false,
          position: 1,
        },
      ],
    })
    await waitFor(() =>
      expect(result.current.saveMessage).toBe('Template de checklist salvo.'),
    )
  })

  it('falls back to Any when removing the last concrete type', async () => {
    const { result } = renderHook(() => useChecklistsTemplates(), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.documents).toHaveLength(2))

    act(() => result.current.changeDocumentType('item-id', ChecklistDocumentType.Pdf))
    expect(result.current.documents[0].types).toEqual([ChecklistDocumentType.Any])
  })

  it('surfaces query and mutation errors', async () => {
    legalAreasService.listLegalAreas.mockResolvedValueOnce(
      new RestResponse<readonly LegalArea[]>({ statusCode: 500, errorMessage: 'failed' }),
    )
    const failedHook = renderHook(() => useChecklistsTemplates(), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(failedHook.result.current.error).toBeTruthy())
    failedHook.unmount()

    const { result } = renderHook(() => useChecklistsTemplates(), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.areas).toHaveLength(2))
    caseManagementService.replaceChecklistTemplate.mockResolvedValueOnce(
      new RestResponse<ChecklistTemplate>({
        statusCode: 500,
        errorMessage: 'save failed',
      }),
    )
    await act(async () => {
      await expect(result.current.saveTemplate()).rejects.toThrow('save failed')
    })
    await waitFor(() => expect(result.current.error).toBeTruthy())
  })
})

function legalArea(id: string, name: string): LegalArea {
  return { id, name, active: true, createdAt: new Date(), updatedAt: new Date() }
}

function checklistTemplate(
  id: string,
  legalAreaId: string,
  items: ChecklistTemplate['items'],
): ChecklistTemplate {
  return {
    id,
    legalAreaId,
    name: 'Checklist',
    isActive: true,
    items,
    updatedAt: new Date(),
  }
}

function checklistItem(
  id: string,
  title: string,
  documentTypes: readonly string[],
  isRequired: boolean,
  position: number,
): ChecklistTemplate['items'][number] {
  return {
    id,
    checklistTemplateId: 'template-civil',
    title,
    documentTypes: documentTypes as ChecklistTemplate['items'][number]['documentTypes'],
    isRequired,
    position,
    updatedAt: new Date(),
  }
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })

  return ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
