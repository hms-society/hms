import { renderHook, act } from '@testing-library/react'
import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'

import { useDocumentViewer } from '../widgets/use-document-viewer'

vi.mock('@tanstack/react-router', () => ({
  useParams: () => ({
    fileId: 'file-123',
  }),
}))

vi.mock('@/ui/shared/hooks/use-document-file-query', () => ({
  useDocumentFileQuery: () => ({
    data: {
      id: 'file-123',
      originalName: 'documento.pdf',
      mimeType: 'application/pdf',
      storagePath: 'seed/documento.pdf',
      sizeBytes: 2048,
      createdAt: '2026-08-10T12:00:00.000Z',
    },
    isLoading: false,
    isError: false,
  }),
}))

vi.mock('@/provision/auth/supabase/supabase-client', () => ({
  supabaseClient: {
    storage: {
      from: () => ({
        download: vi.fn().mockResolvedValue({
          data: new Blob(['pdf']),
          error: null,
        }),
      }),
    },
  },
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useDocumentViewer', () => {
  it('deve carregar os dados do arquivo', () => {
    const { result } = renderHook(() => useDocumentViewer(), {
      wrapper: createWrapper(),
    })

    expect(result.current.file?.id).toBe('file-123')
    expect(result.current.file?.originalName).toBe('documento.pdf')
    expect(result.current.format).toBe('PDF')
  })

  it('deve aumentar e diminuir o zoom', () => {
    const { result } = renderHook(() => useDocumentViewer(), {
      wrapper: createWrapper(),
    })

    expect(result.current.zoom).toBe(1)

    act(() => {
      result.current.handleZoomIn()
    })

    expect(result.current.zoom).toBe(1.25)

    act(() => {
      result.current.handleZoomOut()
    })

    expect(result.current.zoom).toBe(1)
  })

  it('não deve ultrapassar o zoom máximo', () => {
    const { result } = renderHook(() => useDocumentViewer(), {
      wrapper: createWrapper(),
    })

    act(() => {
      for (let index = 0; index < 10; index++) {
        result.current.handleZoomIn()
      }
    })

    expect(result.current.zoom).toBe(2)
  })

  it('deve identificar quando o documento pode ser movimentado', () => {
    const { result } = renderHook(() => useDocumentViewer(), {
      wrapper: createWrapper(),
    })

    expect(result.current.canPan).toBe(false)

    act(() => {
      result.current.handleZoomIn()
    })

    expect(result.current.canPan).toBe(true)
  })
})
