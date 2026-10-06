import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { createElement, type PropsWithChildren } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type {
  LegalAreaWithTopics,
  LegalTopic,
} from '@hms/core/legal-catalog/domain/entities'
import type { LegalCatalogService } from '@hms/core/legal-catalog/interfaces'
import { RestResponse } from '@hms/core/shared/responses/rest-response'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { useLegalCatalogAdminPage } from '../use-legal-catalog-admin-page'

vi.mock('@/ui/shared/hooks/use-rest-context', () => ({
  useRestContext: vi.fn(),
}))

const useRestContextMock = vi.mocked(useRestContext)

const areaId = '550e8400-e29b-41d4-a716-446655440000'
const topicId = '550e8400-e29b-41d4-a716-446655440001'

function makeArea(overrides: Partial<LegalAreaWithTopics> = {}): LegalAreaWithTopics {
  const createdAt = new Date('2026-01-01T00:00:00.000Z')

  return {
    id: areaId,
    name: 'Trabalhista',
    active: true,
    createdAt,
    updatedAt: createdAt,
    topics: [makeTopic()],
    ...overrides,
  }
}

function makeTopic(overrides: Partial<LegalTopic> = {}): LegalTopic {
  const createdAt = new Date('2026-01-01T00:00:00.000Z')

  return {
    id: topicId,
    legalAreaId: areaId,
    name: 'Horas extras',
    active: true,
    createdAt,
    updatedAt: createdAt,
    ...overrides,
  }
}

function makeService() {
  const listAdminLegalAreasMock = vi
    .fn<LegalCatalogService['listAdminLegalAreas']>()
    .mockResolvedValue(new RestResponse({ body: [makeArea()] }))
  const createLegalAreaMock = vi
    .fn<LegalCatalogService['createLegalArea']>()
    .mockResolvedValue(new RestResponse({ body: makeArea() }))
  const updateLegalAreaMock = vi
    .fn<LegalCatalogService['updateLegalArea']>()
    .mockResolvedValue(new RestResponse({ body: makeArea() }))
  const createLegalTopicMock = vi
    .fn<LegalCatalogService['createLegalTopic']>()
    .mockResolvedValue(new RestResponse({ body: makeTopic() }))
  const updateLegalTopicMock = vi
    .fn<LegalCatalogService['updateLegalTopic']>()
    .mockResolvedValue(new RestResponse({ body: makeTopic() }))

  const legalCatalogService: Pick<
    LegalCatalogService,
    | 'listAdminLegalAreas'
    | 'createLegalArea'
    | 'updateLegalArea'
    | 'createLegalTopic'
    | 'updateLegalTopic'
  > = {
    listAdminLegalAreas: listAdminLegalAreasMock,
    createLegalArea: createLegalAreaMock,
    updateLegalArea: updateLegalAreaMock,
    createLegalTopic: createLegalTopicMock,
    updateLegalTopic: updateLegalTopicMock,
  }

  return {
    legalCatalogService,
    listAdminLegalAreasMock,
    createLegalAreaMock,
    updateLegalAreaMock,
    createLegalTopicMock,
    updateLegalTopicMock,
  }
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return function Wrapper({ children }: PropsWithChildren) {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

describe('useLegalCatalogAdminPage', () => {
  let service: ReturnType<typeof makeService>

  beforeEach(() => {
    vi.clearAllMocks()
    service = makeService()
    useRestContextMock.mockReturnValue({
      legalCatalogService: service.legalCatalogService,
    } as never)
  })

  it('loads areas, selects the first one, and filters topics case-insensitively', async () => {
    const { result } = renderHook(() => useLegalCatalogAdminPage(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.selectedAreaId).toBe(areaId))
    expect(result.current.legalAreas).toHaveLength(1)
    expect(result.current.selectedArea?.name).toBe('Trabalhista')
    expect(result.current.filteredTopics).toHaveLength(1)

    act(() => result.current.setSearch('  HORAS  '))

    expect(result.current.filteredTopics.map((topic) => topic.name)).toEqual([
      'Horas extras',
    ])

    act(() => result.current.setSearch('inexistente'))

    expect(result.current.filteredTopics).toEqual([])
  })

  it('keeps an empty catalog unselected and exposes a list request failure', async () => {
    service.listAdminLegalAreasMock.mockResolvedValueOnce(
      new RestResponse({ statusCode: 500, errorMessage: 'list failed' }),
    )
    const { result } = renderHook(() => useLegalCatalogAdminPage(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.error).toBeInstanceOf(Error))
    expect(result.current.legalAreas).toEqual([])
    expect(result.current.selectedAreaId).toBe('')
  })

  it('opens and resets area and topic dialog state', async () => {
    const { result } = renderHook(() => useLegalCatalogAdminPage(), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.selectedArea).toBeDefined())

    act(() => result.current.openNewAreaDialog())
    expect(result.current.dialogState).toEqual({ kind: 'area' })
    expect(result.current.isDialogOpen).toBe(true)
    expect(result.current.name).toBe('')
    expect(result.current.active).toBe(true)

    act(() => {
      result.current.setName('Old name')
      result.current.setActive(false)
      result.current.openEditAreaDialog(result.current.legalAreas[0])
    })
    expect(result.current.dialogState).toMatchObject({
      kind: 'area',
      area: { id: areaId },
    })
    expect(result.current.name).toBe('Trabalhista')
    expect(result.current.active).toBe(true)

    act(() => result.current.openEditTopicDialog(makeTopic()))
    expect(result.current.dialogState).toMatchObject({
      kind: 'topic',
      topic: { id: topicId },
    })
    expect(result.current.name).toBe('Horas extras')

    act(() => result.current.closeDialog())
    expect(result.current.isDialogOpen).toBe(false)
    expect(result.current.name).toBe('')
    expect(result.current.active).toBe(true)
  })

  it('creates and updates areas with the form values and refreshes the catalog', async () => {
    const createdArea = makeArea({ id: '550e8400-e29b-41d4-a716-446655440002' })
    service.createLegalAreaMock.mockResolvedValueOnce(
      new RestResponse({ body: createdArea }),
    )
    service.updateLegalAreaMock.mockResolvedValueOnce(
      new RestResponse({ body: makeArea({ name: 'Trabalhista atualizada' }) }),
    )

    const { result } = renderHook(() => useLegalCatalogAdminPage(), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.selectedArea).toBeDefined())

    act(() => {
      result.current.openNewAreaDialog()
      result.current.setName('  Consumidor  ')
      result.current.setActive(false)
    })
    await act(async () => result.current.handleSaveDialog())

    expect(service.createLegalAreaMock).toHaveBeenCalledWith({
      name: 'Consumidor',
      active: false,
    })
    expect(result.current.feedback).toBe('Configuração salva.')
    expect(result.current.isDialogOpen).toBe(false)

    act(() => {
      result.current.openEditAreaDialog(result.current.legalAreas[0])
      result.current.setName('Trabalhista atualizada')
      result.current.setActive(false)
    })
    await act(async () => result.current.handleSaveDialog())

    expect(service.updateLegalAreaMock).toHaveBeenCalledWith(areaId, {
      name: 'Trabalhista atualizada',
      active: false,
    })
    expect(service.listAdminLegalAreasMock).toHaveBeenCalledTimes(3)
  })

  it('creates and updates topics for the selected area', async () => {
    service.createLegalTopicMock.mockResolvedValueOnce(
      new RestResponse({
        body: makeTopic({ id: '550e8400-e29b-41d4-a716-446655440003' }),
      }),
    )
    service.updateLegalTopicMock.mockResolvedValueOnce(
      new RestResponse({ body: makeTopic({ name: 'Aposentadoria atualizada' }) }),
    )
    const { result } = renderHook(() => useLegalCatalogAdminPage(), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.selectedArea).toBeDefined())

    act(() => {
      result.current.openNewTopicDialog()
      result.current.setName('Aposentadoria')
    })
    await act(async () => result.current.handleSaveDialog())
    expect(service.createLegalTopicMock).toHaveBeenCalledWith({
      legalAreaId: areaId,
      name: 'Aposentadoria',
      active: true,
    })

    act(() => {
      result.current.openEditTopicDialog(makeTopic())
      result.current.setName('Aposentadoria atualizada')
      result.current.setActive(false)
    })
    await act(async () => result.current.handleSaveDialog())
    expect(service.updateLegalTopicMock).toHaveBeenCalledWith(topicId, {
      name: 'Aposentadoria atualizada',
      active: false,
    })
  })

  it('toggles area and topic availability and surfaces mutation failures', async () => {
    const { result } = renderHook(() => useLegalCatalogAdminPage(), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.selectedArea).toBeDefined())

    act(() => {
      result.current.handleToggleArea(makeArea())
      result.current.handleToggleTopic(makeTopic())
    })

    await waitFor(() => {
      expect(service.updateLegalAreaMock).toHaveBeenCalledWith(areaId, { active: false })
      expect(service.updateLegalTopicMock).toHaveBeenCalledWith(topicId, {
        active: false,
      })
    })

    service.createLegalAreaMock.mockResolvedValueOnce(
      new RestResponse({ statusCode: 500, errorMessage: 'save failed' }),
    )
    act(() => {
      result.current.openNewAreaDialog()
      result.current.setName('Inválida')
    })
    await act(async () => {
      await result.current.handleSaveDialog().catch(() => undefined)
    })

    await waitFor(() => expect(result.current.error).toBeInstanceOf(Error))
    expect(result.current.isDialogOpen).toBe(true)
  })

  it('does not issue a topic mutation when no area is selected', async () => {
    service.listAdminLegalAreasMock.mockResolvedValueOnce(new RestResponse({ body: [] }))
    const { result } = renderHook(() => useLegalCatalogAdminPage(), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => {
      result.current.openNewTopicDialog()
      result.current.setName('Sem área')
    })
    await act(async () => result.current.handleSaveDialog())

    expect(service.createLegalTopicMock).not.toHaveBeenCalled()
    expect(service.updateLegalTopicMock).not.toHaveBeenCalled()
  })

  it('exposes area and topic availability update failures', async () => {
    service.updateLegalAreaMock.mockResolvedValueOnce(
      new RestResponse({ statusCode: 500, errorMessage: 'area toggle failed' }),
    )
    const { result: areaResult } = renderHook(() => useLegalCatalogAdminPage(), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(areaResult.current.selectedArea).toBeDefined())

    act(() => areaResult.current.handleToggleArea(makeArea()))
    await waitFor(() => expect(areaResult.current.error).toBeInstanceOf(Error))

    service.updateLegalTopicMock.mockResolvedValueOnce(
      new RestResponse({ statusCode: 500, errorMessage: 'topic toggle failed' }),
    )
    const { result: topicResult } = renderHook(() => useLegalCatalogAdminPage(), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(topicResult.current.selectedArea).toBeDefined())

    act(() => topicResult.current.handleToggleTopic(makeTopic()))
    await waitFor(() => expect(topicResult.current.error).toBeInstanceOf(Error))
  })
})
