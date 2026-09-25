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

const CASE_ID = 'case-id'
const DOCUMENT_ID = 'document-id'
const VERSION_ID = 'version-id'

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

function createDocumentResponse(content = initialContent) {
  return new RestResponse({
    body: {
      id: DOCUMENT_ID,
      title: 'Requerimento previdenciário',
      currentVersionId: VERSION_ID,
      versions: [
        {
          id: VERSION_ID,
          versionNumber: 1,
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
  const caseDocumentProductionService = {
    getDocument: vi.fn().mockResolvedValue(createDocumentResponse()),
    saveEditedContent: vi
      .fn()
      .mockResolvedValue(new RestResponse({ body: { savedAt: '2026-09-25T12:01:00Z' } })),
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
  it('saves the latest edit before navigating back to the case', async () => {
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
    expect(caseDocumentProductionService.saveEditedContent).toHaveBeenCalledWith(
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

  it('flushes a pending edit when the editor unmounts', async () => {
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
    act(() => unmount())

    const { caseDocumentProductionService } = useRestContextMock.mock.results[0].value
    await waitFor(() =>
      expect(caseDocumentProductionService.saveEditedContent).toHaveBeenCalledWith(
        CASE_ID,
        DOCUMENT_ID,
        VERSION_ID,
        editedContent,
      ),
    )
  })

  it('updates the cached document version after the server confirms a save', async () => {
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
      await new Promise((resolve) => window.setTimeout(resolve, 750))
    })

    const cachedResponse = queryClient.getQueryData<
      RestResponse<ReturnType<typeof createDocumentResponse>['body']>
    >(['case-document', CASE_ID, DOCUMENT_ID])
    expect(cachedResponse?.body.versions[0]?.content).toEqual(editedContent)
  })
})
