import { createElement, type PropsWithChildren } from 'react'
import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useDocumentFileQuery } from '@/ui/document-engine/hooks/use-document-file-query'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'

import { useDocumentViewer } from '../use-document-viewer'

vi.mock('@tanstack/react-router', () => ({
  useParams: () => ({ fileId: 'file-123' }),
}))

vi.mock('@/ui/document-engine/hooks/use-document-file-query', () => ({
  useDocumentFileQuery: vi.fn(),
}))

vi.mock('@/ui/shared/hooks/use-navigation', () => ({
  useNavigation: vi.fn(),
}))

const useDocumentFileQueryMock = vi.mocked(useDocumentFileQuery)
const useNavigationMock = vi.mocked(useNavigation)

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return function QueryProvider({ children }: PropsWithChildren) {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

describe('useDocumentViewer', () => {
  const navigateTo = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    useDocumentFileQueryMock.mockReturnValue({
      file: {
        id: 'file-123',
        originalName: 'documento.pdf',
        mimeType: 'application/pdf',
        storagePath: 'seed/documento.pdf',
        sizeBytes: 2048,
        createdAt: '2026-08-10T12:00:00.000Z',
      },
      fileError: null,
      isLoadingFile: false,
      isErrorFile: false,
    } as never)
    useNavigationMock.mockReturnValue({
      navigateTo,
      navigateCollaboratorsSearch: vi.fn(),
    })
  })

  it('exposes the loaded file metadata and formatted size', () => {
    const { result } = renderHook(() => useDocumentViewer(), {
      wrapper: createWrapper(),
    })

    expect(result.current.file?.id).toBe('file-123')
    expect(result.current.format).toBe('PDF')
    expect(result.current.formattedFileSize).toBe('2 KB')
  })

  it('navigates back to the document inbox', () => {
    const { result } = renderHook(() => useDocumentViewer(), {
      wrapper: createWrapper(),
    })

    act(() => result.current.handleBack())

    expect(navigateTo).toHaveBeenCalledWith('documentInbox')
  })
})
