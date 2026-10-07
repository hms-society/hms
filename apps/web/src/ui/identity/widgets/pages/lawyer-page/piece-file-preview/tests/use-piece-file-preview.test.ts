import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { usePieceFilePreview } from '../use-piece-file-preview'

vi.mock('docx-preview', () => ({ renderAsync: vi.fn() }))
vi.mock('@/ui/shared/hooks/use-rest-context', () => ({
  useRestContext: vi.fn(),
}))

const useRestContextMock = vi.mocked(useRestContext)

describe('usePieceFilePreview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn(() => 'blob:document-version'),
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: vi.fn(),
    })
  })

  it('loads the selected version file when storagePath is unavailable', async () => {
    const getDocumentFileMock = vi.fn().mockResolvedValue({
      isFailure: false,
      body: new Blob(['document'], { type: 'application/pdf' }),
    })
    useRestContextMock.mockReturnValue({
      caseDocumentProductionService: { getDocumentFile: getDocumentFileMock },
    } as unknown as ReturnType<typeof useRestContext>)

    renderHook(
      () =>
        usePieceFilePreview({
          caseId: 'case-1',
          documentId: 'document-1',
          versionId: 'version-2',
        }),
      { wrapper: createQueryWrapper() },
    )

    await waitFor(() => {
      expect(getDocumentFileMock).toHaveBeenCalledWith(
        'case-1',
        'document-1',
        'version-2',
      )
    })
  })
})

function createQueryWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return function QueryWrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }
}
