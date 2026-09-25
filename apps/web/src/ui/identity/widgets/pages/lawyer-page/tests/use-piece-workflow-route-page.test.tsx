import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { DocumentTemplateContent } from '@hms/core/document-production/domain/structures'
import { RestResponse } from '@hms/core/shared/responses/rest-response'

import { useCurrentCollaboratorQuery } from '@/ui/identity/hooks/use-current-collaborator-query'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { usePieceWorkflowRoutePage } from '../use-piece-workflow-route-page'

vi.mock('@/ui/identity/hooks/use-current-collaborator-query', () => ({
  useCurrentCollaboratorQuery: vi.fn(),
}))
vi.mock('@/ui/shared/hooks/use-navigation', () => ({ useNavigation: vi.fn() }))
vi.mock('@/ui/shared/hooks/use-rest-context', () => ({ useRestContext: vi.fn() }))

const useCurrentCollaboratorQueryMock = vi.mocked(useCurrentCollaboratorQuery)
const useNavigationMock = vi.mocked(useNavigation)
const useRestContextMock = vi.mocked(useRestContext)
let getDocumentMock: ReturnType<typeof vi.fn>

const CASE_ID = 'case-id'
const DOCUMENT_ID = 'document-id'
const VERSION_ID = 'version-id'
const OLDER_VERSION_ID = 'older-version-id'

const initialContent = {
  type: 'doc',
  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Texto original.' }] }],
} as unknown as DocumentTemplateContent

const editedContent = {
  type: 'doc',
  content: [
    { type: 'paragraph', content: [{ type: 'text', text: 'Texto atualizado.' }] },
  ],
} as unknown as DocumentTemplateContent

function createDocumentResponse(content = initialContent, currentVersionId = VERSION_ID) {
  return new RestResponse({
    body: {
      id: DOCUMENT_ID,
      title: 'Requerimento previdenciário',
      currentVersionId,
      versions: [
        {
          id: OLDER_VERSION_ID,
          versionNumber: 1,
          source: 'ai' as const,
          status: 'approved',
          createdAt: '2026-09-24T12:00:00.000Z',
          createdByCollaboratorId: 'other-collaborator-id',
          content: {
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Conteúdo da versão anterior.' }],
              },
            ],
          } as unknown as DocumentTemplateContent,
          pendingVariables: [],
        },
        {
          id: VERSION_ID,
          versionNumber: 2,
          source: 'ai' as const,
          status: 'in_review',
          createdAt: '2026-09-25T12:00:00.000Z',
          createdByCollaboratorId: 'collaborator-id',
          content,
          pendingVariables: [],
        },
      ],
    },
    statusCode: 200,
  })
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

beforeEach(() => {
  getDocumentMock = vi.fn().mockResolvedValue(createDocumentResponse())
  const caseDocumentProductionService = {
    getDocument: getDocumentMock,
    saveManualVersion: vi
      .fn()
      .mockResolvedValue(new RestResponse({ body: { id: 'new-version-id' } })),
    generateRevision: vi.fn().mockResolvedValue(
      new RestResponse({
        body: { documentGenerationId: 'generation-2', documentId: DOCUMENT_ID },
      }),
    ),
  }
  const caseManagementService = {
    getLegalCaseDetails: vi
      .fn()
      .mockResolvedValue(
        new RestResponse({ body: { publicCode: 'CASO-20260925-0002' } }),
      ),
  }

  useCurrentCollaboratorQueryMock.mockReturnValue({
    currentCollaborator: null,
    currentCollaboratorError: null,
    isLoadingCurrentCollaborator: false,
  })
  useNavigationMock.mockReturnValue({
    navigateCollaboratorsSearch: vi.fn(),
    navigateTo: vi.fn().mockResolvedValue(undefined),
  })
  useRestContextMock.mockReturnValue({
    caseDocumentProductionService,
    caseManagementService,
  } as never)
})

describe('usePieceWorkflowRoutePage', () => {
  it('uses the newest version as current even if the persisted pointer is stale', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    getDocumentMock.mockResolvedValue(
      createDocumentResponse(initialContent, OLDER_VERSION_ID),
    )

    const { result } = renderHook(
      () =>
        usePieceWorkflowRoutePage({
          mode: 'editor',
          caseId: CASE_ID,
          documentId: DOCUMENT_ID,
        }),
      { wrapper },
    )

    await waitFor(() => expect(result.current.version?.id).toBe(VERSION_ID))
    expect(result.current.isReadOnlyVersion).toBe(false)
  })

  it('loads the selected historical version as read-only content', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    const { result } = renderHook(
      () =>
        usePieceWorkflowRoutePage({
          mode: 'editor',
          caseId: CASE_ID,
          documentId: DOCUMENT_ID,
        }),
      { wrapper },
    )

    await waitFor(() => expect(result.current.version?.id).toBe(VERSION_ID))
    act(() => result.current.handleSelectVersion(OLDER_VERSION_ID))

    expect(result.current.version?.id).toBe(OLDER_VERSION_ID)
    expect(result.current.isReadOnlyVersion).toBe(true)
    expect(JSON.stringify(result.current.version?.content)).toContain(
      'Conteúdo da versão anterior.',
    )
  })

  it('keeps historical versions read-only when starting a manual version', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    const { result } = renderHook(
      () =>
        usePieceWorkflowRoutePage({
          mode: 'editor',
          caseId: CASE_ID,
          documentId: DOCUMENT_ID,
        }),
      { wrapper },
    )
    await waitFor(() => expect(result.current.version?.id).toBe(VERSION_ID))
    act(() => result.current.handleSelectVersion(OLDER_VERSION_ID))

    act(() => result.current.handleStartManualVersion(OLDER_VERSION_ID))

    expect(result.current.isReadOnlyVersion).toBe(true)
    expect(result.current.versionActionError).toBe(
      'Somente a versão atual pode ser aberta para edição manual.',
    )
  })

  it('asks before discarding unsaved edits when selecting another version', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    const { result } = renderHook(
      () =>
        usePieceWorkflowRoutePage({
          mode: 'editor',
          caseId: CASE_ID,
          documentId: DOCUMENT_ID,
        }),
      { wrapper },
    )

    await waitFor(() => expect(result.current.version?.id).toBe(VERSION_ID))
    act(() => result.current.handleChangeContent(editedContent))
    act(() => result.current.handleSelectVersion(OLDER_VERSION_ID))

    expect(result.current.isDiscardEditsDialogOpen).toBe(true)
    expect(result.current.version?.id).toBe(VERSION_ID)

    act(() => result.current.handleConfirmDiscardEdits())

    expect(result.current.version?.id).toBe(OLDER_VERSION_ID)
    expect(result.current.editedContent).toBeNull()
    expect(result.current.isReadOnlyVersion).toBe(true)
  })

  it('does not treat editor-added default attributes as unsaved content changes', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    const { result } = renderHook(
      () =>
        usePieceWorkflowRoutePage({
          mode: 'editor',
          caseId: CASE_ID,
          documentId: DOCUMENT_ID,
        }),
      { wrapper },
    )
    await waitFor(() => expect(result.current.version?.id).toBe(VERSION_ID))
    const normalizedByEditor = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          attrs: { textAlign: null },
          content: [{ type: 'text', text: 'Texto original.' }],
        },
      ],
    } as unknown as DocumentTemplateContent

    act(() => result.current.handleChangeContent(normalizedByEditor))
    act(() => result.current.handleSelectVersion(OLDER_VERSION_ID))

    expect(result.current.editedContent).toBeNull()
    expect(result.current.isDiscardEditsDialogOpen).toBe(false)
    expect(result.current.version?.id).toBe(OLDER_VERSION_ID)
  })

  it('saves edits as a new manual version before navigating back to the case', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    const { result } = renderHook(
      () =>
        usePieceWorkflowRoutePage({
          mode: 'editor',
          caseId: CASE_ID,
          documentId: DOCUMENT_ID,
        }),
      { wrapper },
    )

    await waitFor(() => expect(result.current.version?.id).toBe(VERSION_ID))
    act(() => result.current.handleChangeContent(editedContent))

    await act(async () => {
      await result.current.handleBackToCase()
    })

    const { caseDocumentProductionService } = useRestContextMock.mock.results[0].value
    expect(caseDocumentProductionService.saveManualVersion).toHaveBeenCalledWith(
      CASE_ID,
      DOCUMENT_ID,
      VERSION_ID,
      editedContent,
    )
    expect(useNavigationMock.mock.results[0].value.navigateTo).toHaveBeenCalledWith(
      'lawyerCaseDetails',
      { params: { caseId: CASE_ID } },
    )
  })

  it('does not write over a historical version while the editor unmounts', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    const { result, unmount } = renderHook(
      () =>
        usePieceWorkflowRoutePage({
          mode: 'editor',
          caseId: CASE_ID,
          documentId: DOCUMENT_ID,
        }),
      { wrapper },
    )

    await waitFor(() => expect(result.current.version?.id).toBe(VERSION_ID))
    act(() => result.current.handleChangeContent(editedContent))
    unmount()

    const { caseDocumentProductionService } = useRestContextMock.mock.results[0].value
    expect(caseDocumentProductionService.saveManualVersion).not.toHaveBeenCalled()
  })

  it('creates a separate manual version when the user explicitly saves edits', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    const { result } = renderHook(
      () =>
        usePieceWorkflowRoutePage({
          mode: 'editor',
          caseId: CASE_ID,
          documentId: DOCUMENT_ID,
        }),
      { wrapper },
    )
    await waitFor(() => expect(result.current.version?.id).toBe(VERSION_ID))

    act(() => result.current.handleStartManualVersion(VERSION_ID))
    act(() => result.current.handleChangeContent(editedContent))
    await act(async () => result.current.handleSaveNewVersion())

    const { caseDocumentProductionService } = useRestContextMock.mock.results[0].value
    expect(caseDocumentProductionService.saveManualVersion).toHaveBeenCalledWith(
      CASE_ID,
      DOCUMENT_ID,
      VERSION_ID,
      editedContent,
    )
  })

  it('allows AI generation from an untouched manual draft', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    const { result } = renderHook(
      () =>
        usePieceWorkflowRoutePage({
          mode: 'editor',
          caseId: CASE_ID,
          documentId: DOCUMENT_ID,
        }),
      { wrapper },
    )
    await waitFor(() => expect(result.current.version?.id).toBe(VERSION_ID))

    act(() => result.current.handleStartManualVersion(VERSION_ID))
    await act(async () => {
      await result.current.handleGenerateRevision(VERSION_ID, 'Atualize os pedidos.')
    })

    const { caseDocumentProductionService } = useRestContextMock.mock.results[0].value
    expect(caseDocumentProductionService.generateRevision).toHaveBeenCalledWith(
      CASE_ID,
      DOCUMENT_ID,
      VERSION_ID,
      'Atualize os pedidos.',
    )
    expect(result.current.versionActionError).toBeUndefined()
  })

  it('saves the current draft automatically before opening the new-version flow', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    const { result } = renderHook(
      () =>
        usePieceWorkflowRoutePage({
          mode: 'editor',
          caseId: CASE_ID,
          documentId: DOCUMENT_ID,
        }),
      { wrapper },
    )
    await waitFor(() => expect(result.current.version?.id).toBe(VERSION_ID))
    act(() => result.current.handleStartManualVersion(VERSION_ID))
    act(() => result.current.handleChangeContent(editedContent))

    await act(async () => result.current.handleOpenVersionDialog())

    const { caseDocumentProductionService } = useRestContextMock.mock.results[0].value
    expect(caseDocumentProductionService.saveManualVersion).toHaveBeenCalledWith(
      CASE_ID,
      DOCUMENT_ID,
      VERSION_ID,
      editedContent,
    )
    expect(result.current.editedContent).toBeNull()
    expect(result.current.isVersionDialogOpen).toBe(true)

    await act(async () => {
      await result.current.handleGenerateRevision(
        'new-version-id',
        'Inclua um pedido adicional.',
      )
    })

    expect(caseDocumentProductionService.generateRevision).toHaveBeenCalledWith(
      CASE_ID,
      DOCUMENT_ID,
      'new-version-id',
      'Inclua um pedido adicional.',
    )
    expect(result.current.versionActionError).toBeUndefined()
  })

  it('saves an edited draft before generating an AI revision from that saved version', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    const { result } = renderHook(
      () =>
        usePieceWorkflowRoutePage({
          mode: 'editor',
          caseId: CASE_ID,
          documentId: DOCUMENT_ID,
        }),
      { wrapper },
    )
    await waitFor(() => expect(result.current.version?.id).toBe(VERSION_ID))
    act(() => result.current.handleStartManualVersion(VERSION_ID))
    act(() => result.current.handleChangeContent(editedContent))

    await act(async () => {
      await result.current.handleGenerateRevision(
        VERSION_ID,
        'Inclua um pedido adicional.',
      )
    })

    const { caseDocumentProductionService } = useRestContextMock.mock.results[0].value
    expect(caseDocumentProductionService.saveManualVersion).toHaveBeenCalledWith(
      CASE_ID,
      DOCUMENT_ID,
      VERSION_ID,
      editedContent,
    )
    expect(caseDocumentProductionService.generateRevision).toHaveBeenCalledWith(
      CASE_ID,
      DOCUMENT_ID,
      'new-version-id',
      'Inclua um pedido adicional.',
    )
    expect(result.current.versionActionError).toBeUndefined()
  })
})
