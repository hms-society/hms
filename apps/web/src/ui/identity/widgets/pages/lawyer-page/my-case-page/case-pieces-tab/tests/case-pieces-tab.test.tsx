import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { CasePiecesTab } from '..'

describe('CasePiecesTab', () => {
  afterEach(cleanup)

  it('renders the released legal production view after dossier approval', () => {
    render(<CasePiecesTab dossierApproved />)

    expect(screen.getByText('Dossiê aprovado em 14/07')).toBeTruthy()
    expect(screen.getByText('Produção Jurídica')).toBeTruthy()
    expect(screen.getByText(/Requerimento Administrativo/)).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Nova peça' })).toBeTruthy()
  })

  it('blocks legal writing when the dossier is not approved', () => {
    render(<CasePiecesTab dossierApproved={false} />)

    expect(screen.getByText('Produção jurídica bloqueada')).toBeTruthy()
    expect(
      screen.getByText(
        'A elaboração de peças será liberada após a aprovação do dossiê documental.',
      ),
    ).toBeTruthy()
    expect(screen.queryByText('Requerimento Administrativo')).toBeNull()
  })
})
