import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PieceFilePreview } from '../index'
import { usePieceFilePreview } from '../use-piece-file-preview'

vi.mock('../use-piece-file-preview', () => ({
  usePieceFilePreview: vi.fn(),
}))

const usePieceFilePreviewMock = vi.mocked(usePieceFilePreview)

describe('PieceFilePreview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    usePieceFilePreviewMock.mockReturnValue({
      docxContainerRef: { current: null },
      fileQuery: {
        data: new Blob(['document'], { type: 'application/pdf' }),
        isError: false,
        isLoading: false,
      } as never,
      fileUrl: 'blob:document-version',
      isRendering: false,
      renderError: undefined,
    })
  })

  it('renders the downloaded file when the selected version has no storagePath', () => {
    render(
      <PieceFilePreview caseId='case-1' documentId='document-1' versionId='version-2' />,
    )

    expect(
      screen.queryByText('Esta versão ainda não possui um arquivo associado no Storage.'),
    ).toBeNull()
    expect(
      screen.getByTitle('Visualização do documento da peça').getAttribute('src'),
    ).toBe('blob:document-version')
  })
})
