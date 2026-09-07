import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { SigningDocumentViewer } from '../index'
import { useSigningDocumentViewer } from '../use-signing-document-viewer'

vi.mock('../use-signing-document-viewer', () => ({ useSigningDocumentViewer: vi.fn() }))

describe('SigningDocumentViewer', () => {
  afterEach(cleanup)

  it('exposes a recoverable private-content error', () => {
    const onRetry = vi.fn()
    vi.mocked(useSigningDocumentViewer).mockReturnValue({
      currentPage: 1,
      objectUrl: undefined,
    })
    render(
      <SigningDocumentViewer
        documentId='document-1'
        title='Contrato'
        content={null}
        isLoading={false}
        error='private storage unavailable'
        onRetry={onRetry}
      />,
    )
    expect(screen.getByRole('alert')).toBeTruthy()
    screen.getByRole('button', { name: 'Tentar novamente' }).click()
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('leaves zoom control to the native PDF viewer', () => {
    vi.mocked(useSigningDocumentViewer).mockReturnValue({
      currentPage: 1,
      objectUrl: 'blob:signing-document',
    })

    render(
      <SigningDocumentViewer
        documentId='document-1'
        title='Contrato'
        pageCount={1}
        content={new ArrayBuffer(8)}
        isLoading={false}
        onRetry={vi.fn()}
      />,
    )

    expect(screen.queryByRole('button', { name: 'Diminuir zoom' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Aumentar zoom' })).toBeNull()
    expect(screen.getByTitle('Contrato').getAttribute('style')).toBeNull()
  })
})
