import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { RestContext } from '@/ui/shared/contexts/rest-context'
import { CasePiecesTab } from '..'

vi.mock('@/ui/shared/hooks/use-navigation', () => ({
  useNavigation: () => ({ navigateTo: vi.fn() }),
}))

function renderCasePiecesTab(dossierApproved: boolean) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <RestContext.Provider
        value={
          {
            caseDocumentProductionService: { listDocuments: vi.fn() },
          } as never
        }
      >
        <CasePiecesTab dossierApproved={dossierApproved} />
      </RestContext.Provider>
    </QueryClientProvider>,
  )
}

describe('CasePiecesTab', () => {
  afterEach(cleanup)

  it('renders the released legal production view after dossier approval', () => {
    renderCasePiecesTab(true)

    expect(screen.getByText('Dossiê aprovado em 14/07')).toBeTruthy()
    expect(screen.getByText('Produção Jurídica')).toBeTruthy()
    expect(screen.getByText('Nenhuma peça foi adicionada a este caso.')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Nova peça' })).toBeTruthy()
  })

  it('blocks legal writing when the dossier is not approved', () => {
    renderCasePiecesTab(false)

    expect(screen.getByText('Produção jurídica bloqueada')).toBeTruthy()
    expect(
      screen.getByText(
        'A elaboração de peças será liberada após a aprovação do dossiê documental.',
      ),
    ).toBeTruthy()
    expect(screen.queryByText('Requerimento Administrativo')).toBeNull()
  })

  it('opens the new-piece model selector from the Nova peça action', () => {
    renderCasePiecesTab(true)

    fireEvent.click(screen.getByRole('button', { name: 'Nova peça' }))

    expect(screen.getByRole('heading', { name: 'Escolha o modelo' })).toBeTruthy()
  })
})
