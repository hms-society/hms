import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type {
  DocumentSpecificationDetails,
  DocumentTemplateContent,
  DocumentTemplateVariable,
} from '@hms/core/document-production/domain/structures'
import { RestResponse } from '@hms/core/shared/responses/rest-response'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { useDocumentCatalogQuery } from '../../document-specifications-page/use-document-catalog-query'
import { useDocumentTopicsQuery } from '../../document-specifications-page/use-document-topics-query'
import { useDocumentSpecificationActions } from '../use-document-specification-actions'
import {
  type DocumentSpecificationPageProps,
  useDocumentSpecificationPage,
} from '../use-document-specification-page'

vi.mock('@/ui/shared/hooks/use-rest-context', () => ({
  useRestContext: vi.fn(),
}))

vi.mock('../../document-specifications-page/use-document-catalog-query', () => ({
  useDocumentCatalogQuery: vi.fn(),
}))

vi.mock('../../document-specifications-page/use-document-topics-query', () => ({
  useDocumentTopicsQuery: vi.fn(),
}))

vi.mock('../use-document-specification-actions', () => ({
  useDocumentSpecificationActions: vi.fn(),
}))

vi.mock('@tanstack/react-router', () => ({
  useBlocker: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

const useRestContextMock = vi.mocked(useRestContext)
const useDocumentCatalogQueryMock = vi.mocked(useDocumentCatalogQuery)
const useDocumentTopicsQueryMock = vi.mocked(useDocumentTopicsQuery)
const useDocumentSpecificationActionsMock = vi.mocked(useDocumentSpecificationActions)

const TEMPLATE_CONTENT = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      attrs: { textAlign: null },
      content: [{ type: 'text', text: '{{cliente_nome}}' }],
    },
  ],
} as unknown as DocumentTemplateContent

const DETAIL: DocumentSpecificationDetails = {
  documentSpecificationId: 'spec-1',
  name: 'Procuração',
  description: 'Documento de representação',
  application: { scope: 'global', moment: 'consultation' },
  isRequired: true,
  status: 'available',
  content: TEMPLATE_CONTENT,
  variables: [],
  updatedAt: '2026-01-01T00:00:00.000Z',
}

type DocumentSpecificationActions = ReturnType<typeof useDocumentSpecificationActions>

function createActions(
  overrides: Partial<DocumentSpecificationActions> = {},
): DocumentSpecificationActions {
  return {
    createDocumentSpecification: vi.fn().mockResolvedValue(
      new RestResponse({
        body: { documentSpecificationId: 'created-specification' },
        statusCode: 201,
      }),
    ),
    deleteDocumentSpecification: vi.fn().mockResolvedValue(new RestResponse()),
    updateConfiguration: vi.fn().mockResolvedValue(new RestResponse({ body: DETAIL })),
    updateTemplate: vi.fn().mockResolvedValue(new RestResponse({ body: DETAIL })),
    isCreating: false,
    isDeleting: false,
    isUpdatingConfiguration: false,
    isUpdatingTemplate: false,
    createError: null,
    deleteError: null,
    configurationError: null,
    templateError: null,
    ...overrides,
  }
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })

  return function QueryWrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

function renderDocumentSpecificationPage(
  props: DocumentSpecificationPageProps,
  wrapper = createWrapper(),
) {
  return renderHook(() => useDocumentSpecificationPage(props), { wrapper })
}

function createRestServices() {
  return {
    documentProductionService: {
      getDocumentSpecification: vi
        .fn()
        .mockResolvedValue(new RestResponse({ body: DETAIL })),
    },
    legalCatalogService: {
      listLegalAreas: vi.fn().mockResolvedValue(new RestResponse({ body: [] })),
      listLegalTopics: vi.fn().mockResolvedValue(new RestResponse({ body: [] })),
    },
  }
}

describe('useDocumentSpecificationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useRestContextMock.mockReturnValue(createRestServices() as never)
    useDocumentCatalogQueryMock.mockReturnValue({
      areas: { data: [], isLoading: false, isError: false, refetch: vi.fn() },
    } as never)
    useDocumentTopicsQueryMock.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never)
    useDocumentSpecificationActionsMock.mockReturnValue(createActions())
  })

  it('starts a new specification with available status and a disabled save action', () => {
    const { result } = renderDocumentSpecificationPage({ mode: 'create' })

    expect(result.current.activeTab).toBe('configuration')
    expect(result.current.form.getValues('status')).toBe('available')
    expect(result.current.isTemplateEmpty).toBe(true)
    expect(result.current.canSaveModel).toBe(false)
    expect(result.current.isDirty).toBe(false)
    expect(result.current.isDeleteDialogOpen).toBe(false)
  })

  it('loads edit data and normalizes system variables into the page state', async () => {
    const { result } = renderDocumentSpecificationPage({
      mode: 'edit',
      documentSpecificationId: 'spec-1',
    })

    await waitFor(() => expect(result.current.detail.data).toEqual(DETAIL))
    await waitFor(() => expect(result.current.form.getValues('name')).toBe('Procuração'))

    expect(result.current.form.getValues('name')).toBe('Procuração')
    expect(result.current.content).toEqual(TEMPLATE_CONTENT)
    expect(result.current.variables).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: 'Nome do cliente',
          technicalName: 'cliente_nome',
          systemTechnicalName: 'cliente_nome',
        }),
      ]),
    )
    expect(result.current.isDirty).toBe(false)
  })

  it('updates application scope, areas, and topics through the form handlers', () => {
    const { result } = renderDocumentSpecificationPage({ mode: 'create' })

    act(() => result.current.handleApplicationScope('legal_context'))
    act(() => result.current.handleAreaToggle('area-1'))
    act(() => result.current.handleTopicToggle('area-1', 'topic-1'))

    expect(result.current.application).toEqual({
      scope: 'legal_context',
      moment: 'consultation',
      legalAreaIds: ['area-1'],
      legalTopicIdsByArea: { 'area-1': ['topic-1'] },
    })
    expect(result.current.isConfigurationDirty).toBe(true)
  })

  it('renames variable tokens and removes custom variables from the template', async () => {
    const customVariable: DocumentTemplateVariable = {
      label: 'Número do processo',
      technicalName: 'numero_processo',
    }
    const { result } = renderDocumentSpecificationPage({
      mode: 'edit',
      documentSpecificationId: 'spec-1',
    })

    await waitFor(() => expect(result.current.detail.data).toEqual(DETAIL))

    act(() => result.current.handleAddVariable(customVariable))
    act(() =>
      result.current.handleUpdateVariable('cliente_nome', {
        label: 'Cliente contratante',
        technicalName: 'cliente_contratante',
        systemTechnicalName: 'cliente_nome',
      }),
    )

    expect(JSON.stringify(result.current.content)).toContain('{{cliente_contratante}}')
    expect(result.current.variables).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ technicalName: 'cliente_contratante' }),
        customVariable,
      ]),
    )

    act(() => result.current.handleRemoveVariable(customVariable))

    expect(result.current.variables).not.toContain(customVariable)
    expect(JSON.stringify(result.current.content)).not.toContain('numero_processo')
    expect(result.current.isTemplateDirty).toBe(true)
  })

  it('saves a dirty template and configuration together in edit mode', async () => {
    const updateTemplate = vi.fn().mockResolvedValue(new RestResponse({ body: DETAIL }))
    const updateConfiguration = vi
      .fn()
      .mockResolvedValue(new RestResponse({ body: DETAIL }))
    useDocumentSpecificationActionsMock.mockReturnValue(
      createActions({ updateTemplate, updateConfiguration }),
    )
    const { result } = renderDocumentSpecificationPage({
      mode: 'edit',
      documentSpecificationId: 'spec-1',
    })

    await waitFor(() => expect(result.current.detail.data).toEqual(DETAIL))
    await waitFor(() => expect(result.current.form.getValues('name')).toBe('Procuração'))
    act(() =>
      result.current.form.setValue('name', 'Procuração atualizada', {
        shouldDirty: true,
      }),
    )
    act(() =>
      result.current.handleContentChange({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            attrs: { textAlign: null },
            content: [{ type: 'text', text: 'Template atualizado' }],
          },
        ],
      }),
    )
    await waitFor(() => expect(result.current.isTemplateDirty).toBe(true))
    await waitFor(() => expect(result.current.isConfigurationDirty).toBe(true))

    await act(async () => {
      await result.current.handleTemplateSave()
    })

    expect(updateTemplate).toHaveBeenCalledWith({
      id: 'spec-1',
      request: { content: result.current.content, variables: result.current.variables },
    })
    expect(updateConfiguration).toHaveBeenCalledWith({
      id: 'spec-1',
      request: expect.objectContaining({ name: 'Procuração atualizada' }),
    })
    expect(result.current.isDirty).toBe(false)
  })

  it('opens the delete dialog only in edit mode and confirms the delete action', async () => {
    const deleteDocumentSpecification = vi.fn().mockResolvedValue(new RestResponse())
    useDocumentSpecificationActionsMock.mockReturnValue(
      createActions({ deleteDocumentSpecification }),
    )
    const { result } = renderDocumentSpecificationPage({
      mode: 'edit',
      documentSpecificationId: 'spec-1',
    })

    act(() => result.current.handleDeleteRequest())
    expect(result.current.isDeleteDialogOpen).toBe(true)

    act(() => result.current.handleDeleteDialogOpenChange(false))
    expect(result.current.isDeleteDialogOpen).toBe(false)

    act(() => result.current.handleDeleteRequest())
    await act(async () => {
      await result.current.handleDeleteConfirm()
    })

    expect(deleteDocumentSpecification).toHaveBeenCalledWith('spec-1')
  })
})
