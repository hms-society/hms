import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { ChecklistDossierTabProps } from '../checklist-dossier-tab'
import type { CasePiecesTabProps } from '../case-pieces-tab'
import type { OverviewTabProps } from '../overview-tab'
import { CasoDetalheChecklistPage } from '..'
import { useMyCasePage } from '../use-my-case-page'

vi.mock('../use-my-case-page', () => ({ useMyCasePage: vi.fn() }))
vi.mock('../overview-tab', () => ({
  OverviewTab: (_props: OverviewTabProps) => <div />,
}))
vi.mock('../checklist-dossier-tab', () => ({
  ChecklistDossierTab: (_props: ChecklistDossierTabProps) => <div />,
}))
vi.mock('../case-pieces-tab', () => ({
  CasePiecesTab: (_props: CasePiecesTabProps) => <div />,
}))

const useMyCasePageMock = vi.mocked(useMyCasePage)

describe('CasoDetalheChecklistPage piece entry point', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('opens the new-piece dialog and switches to Peças from the case header', () => {
    const setActiveTabMock = vi.fn()
    useMyCasePageMock.mockReturnValue({
      activeTab: 'visao-geral',
      caseClientName: 'Vinicius Lopes Machado',
      caseLegalArea: 'Direito Previdenciário',
      caseTitle: 'Aposentadoria por Tempo de Contribuição',
      caseUuid: 'case-1',
      caseDetails: undefined,
      isLoading: false,
      checklistItems: [],
      completionPercentage: 0,
      displayCaseId: 'CASO-20260923-0002',
      mandatoryItemsCount: 0,
      pendingItemsCount: 0,
      validatedItemsCount: 0,
      handleOpenChecklistTab: vi.fn(),
      setActiveTab: setActiveTabMock,
    })
    const queryClient = new QueryClient()

    render(
      <QueryClientProvider client={queryClient}>
        <CasoDetalheChecklistPage caseId='case-1' />
      </QueryClientProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Nova peça' }))

    expect(screen.getByRole('dialog')).toBeDefined()
    expect(screen.getByRole('heading', { name: 'Escolha o modelo' })).toBeDefined()
    expect(setActiveTabMock).toHaveBeenCalledWith('pecas')
  })
})
