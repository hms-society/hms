import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { CasePieceCard } from '../case-piece-card'
import type { CasePiece } from '../types'

describe('CasePieceCard version download', () => {
  it('forwards the selected version to the download callback', () => {
    const onDownloadVersionMock = vi.fn()
    const piece: CasePiece = {
      id: 'document-1',
      title: 'Petição inicial',
      template: 'Modelo documental',
      author: 'Solicitante atual',
      reviewer: 'Aguardando revisão humana',
      updatedAt: '06/10/2026',
      status: 'Em revisão técnica',
      versions: [
        {
          id: 'version-2',
          label: 'v2',
          title: 'Em revisão',
          author: 'Colaborador responsável',
          timestamp: '06/10/2026',
        },
      ],
    }

    render(<CasePieceCard piece={piece} onDownloadVersion={onDownloadVersionMock} />)

    fireEvent.click(screen.getByRole('button', { name: 'Baixar v2' }))

    expect(onDownloadVersionMock).toHaveBeenCalledWith('version-2', 'v2')
  })
})
