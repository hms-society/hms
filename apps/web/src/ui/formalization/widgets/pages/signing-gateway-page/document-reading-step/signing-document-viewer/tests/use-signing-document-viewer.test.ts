import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useSigningDocumentViewer } from '../use-signing-document-viewer'

const createObjectURLMock = vi.fn(() => 'blob:signing-document')
const revokeObjectURLMock = vi.fn()

describe('useSigningDocumentViewer', () => {
  beforeEach(() => {
    vi.stubGlobal('URL', {
      createObjectURL: createObjectURLMock,
      revokeObjectURL: revokeObjectURLMock,
    })
    vi.clearAllMocks()
  })

  afterEach(() => vi.unstubAllGlobals())

  it('creates a PDF object URL only after authorized bytes arrive', () => {
    const { result } = renderHook(() =>
      useSigningDocumentViewer({
        documentId: 'document-1',
        title: 'Contract',
        content: new ArrayBuffer(8),
        isLoading: false,
        onRetry: vi.fn(),
      }),
    )

    expect(result.current.objectUrl).toBe('blob:signing-document')
    expect(createObjectURLMock).toHaveBeenCalled()
  })

  it('revokes the previous object URL when content changes and on unmount', () => {
    const firstContent = new ArrayBuffer(8)
    const secondContent = new ArrayBuffer(16)
    const { rerender, unmount } = renderHook(
      ({ content }) =>
        useSigningDocumentViewer({
          documentId: 'document-1',
          title: 'Contract',
          content,
          isLoading: false,
          onRetry: vi.fn(),
        }),
      { initialProps: { content: firstContent } },
    )

    rerender({ content: secondContent })
    expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:signing-document')
    unmount()
    expect(revokeObjectURLMock).toHaveBeenCalledTimes(2)
  })

  it('exposes the initial page without duplicating native PDF zoom state', () => {
    const { result } = renderHook(() =>
      useSigningDocumentViewer({
        documentId: 'document-1',
        title: 'Contract',
        content: null,
        isLoading: false,
        onRetry: vi.fn(),
      }),
    )

    expect(result.current.currentPage).toBe(1)
    expect(result.current).not.toHaveProperty('zoom')
    expect(result.current).not.toHaveProperty('setZoom')
  })
})
