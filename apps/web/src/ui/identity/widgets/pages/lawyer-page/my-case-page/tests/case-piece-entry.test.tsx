import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { ChecklistDossierTabProps } from '../checklist-dossier-tab'
import type { CasePiecesTabProps } from '../case-pieces-tab'
import type { NewPieceDialogProps } from '../case-pieces-tab/new-piece-dialog'
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
  CasePiecesTab: ({ caseId, dossierApproved }: CasePiecesTabProps) => (
    <div
      data-testid='case-pieces'
      data-case-id={caseId}
      data-dossier-approved={dossierApproved}
    />
  ),
}))
vi.mock('../case-pieces-tab/new-piece-dialog', () => ({
  NewPieceDialog: ({ caseId, open }: NewPieceDialogProps) =>
    open ? <div role='dialog' data-case-id={caseId} /> : null,
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
      activeTab: 'pecas',
      caseClientName: 'Vinicius Lopes Machado',
      caseLegalArea: 'Direito Previdenciário',
      caseTitle: 'Aposentadoria por Tempo de Contribuição',
      caseUuid: 'case-1',
      caseDetails: {
        status: 'ready_for_legal_production',
        dossierGate: {},
      } as never,
      caseStatusLabel: 'Pronto para produção jurídica',
      caseStages: [],
      dossierApproved: false,
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

    expect(screen.getByRole('dialog').getAttribute('data-case-id')).toBe('case-1')
    expect(screen.getByText('Pronto para produção jurídica')).toBeDefined()
    expect(screen.getByTestId('case-pieces').getAttribute('data-dossier-approved')).toBe(
      'false',
    )
    expect(setActiveTabMock).toHaveBeenCalledWith('pecas')
  })
})
