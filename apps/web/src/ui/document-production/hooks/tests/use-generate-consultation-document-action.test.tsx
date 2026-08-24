import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RestResponse } from '@hms/core/shared/responses/rest-response'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { consultationDocumentQueryKeys } from '../consultation-document-query-keys'
import { useGenerateConsultationDocumentAction } from '../use-generate-consultation-document-action'

vi.mock('@/ui/shared/hooks/use-rest-context', () => ({
  useRestContext: vi.fn(),
}))

const useRestContextMock = vi.mocked(useRestContext)

describe('useGenerateConsultationDocumentAction', () => {
  const consultationDocumentProductionService = {
    generateDocument: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    useRestContextMock.mockReturnValue({
      consultationDocumentProductionService,
    } as never)
  })

  it('shows the document as pending before an active query is cancelled', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    const consultationId = 'consultation-1'
    const documentId = 'document-1'
    queryClient.setQueryData(consultationDocumentQueryKeys.list(consultationId), [
      { id: documentId, versions: [] },
    ])

    let releaseCancellation!: () => void
    const cancellation = new Promise<void>((resolve) => {
      releaseCancellation = resolve
    })
    vi.spyOn(queryClient, 'cancelQueries').mockReturnValue(cancellation)
    consultationDocumentProductionService.generateDocument.mockResolvedValue(
      new RestResponse({ statusCode: 202 }),
    )

    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    const { result, unmount } = renderHook(
      () => useGenerateConsultationDocumentAction(consultationId),
      { wrapper },
    )

    await waitFor(() => expect(result.current.pendingDocumentIds).toEqual([]))

    const generation = result.current.generateDocument({ documentId })

    await waitFor(() => expect(result.current.pendingDocumentIds).toContain(documentId))
    await waitFor(() =>
      expect(
        consultationDocumentProductionService.generateDocument,
      ).toHaveBeenCalledOnce(),
    )

    releaseCancellation()
    await generation
    unmount()
  })
})
