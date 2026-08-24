import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ChecklistDossierTab } from '..'
import { useChecklistDossierTab } from '../use-checklist-dossier-tab'

vi.mock('../use-checklist-dossier-tab', () => ({
  useChecklistDossierTab: vi.fn(),
}))

const useChecklistDossierTabMock = vi.mocked(useChecklistDossierTab)

function createController(
  overrides: Partial<ReturnType<typeof useChecklistDossierTab>> = {},
): ReturnType<typeof useChecklistDossierTab> {
  return {
    canStartLegalWriting: false,
    checklistGateLabel: 'Checklist pendente',
    checklistGateRemarks: undefined,
    decisionReasonDialog: {
      confirmLabel: 'Confirmar exceção',
      description: 'Ao confirmar, o checklist avançará com ressalvas.',
      title: 'Deseja aprovar com exceção?',
    },
    dossierGateLabel: 'Dossiê pendente',
    error: null,
    handleApproveChecklist: vi.fn(),
    handleApproveWithException: vi.fn(),
    handleBlockChecklist: vi.fn(),
    handleCancelDecisionReason: vi.fn(),
    handleConfirmDecisionReason: vi.fn(),
    handleDecisionReasonDialogOpenChange: vi.fn(),
    handleRejectOnMerit: vi.fn(),
    handleRemarksChange: vi.fn(),
    isDecisionReasonDialogOpen: false,
    isChecklistComplete: false,
    isReviewingChecklistGate: false,
    mandatoryItemsCount: 2,
    pendingItemsCount: 1,
    reasonError: null,
    remarks: '',
    validatedItemsCount: 1,
    ...overrides,
  }
}

describe('ChecklistDossierTab', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(cleanup)

  it('renders sequential checklist and dossier gates and delegates lawyer decisions', () => {
    const handleApproveWithException = vi.fn()
    useChecklistDossierTabMock.mockReturnValue(
      createController({ handleApproveWithException }),
    )

    render(
      <ChecklistDossierTab
        activities={[]}
        caseId='case-1'
        checklist={[
          { id: '1', title: 'Procuração', status: 'validado' },
          { id: '2', title: 'CNIS', status: 'solicitado', pendencies: 1 },
        ]}
        expectedVersion={1}
      />,
    )

    expect(screen.getByText('Checklist pendente')).toBeTruthy()
    expect(screen.getByText('Dossiê pendente')).toBeTruthy()
    expect(screen.getByText('Escrita bloqueada')).toBeTruthy()
    expect(screen.getByText('1 de 2 obrigatórios - 50%')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /aprovar com exceção/i }))

    expect(handleApproveWithException).toHaveBeenCalledOnce()
    expect(useChecklistDossierTabMock).toHaveBeenCalledWith({
      caseId: 'case-1',
      checklist: [
        { id: '1', title: 'Procuração', status: 'validado' },
        { id: '2', title: 'CNIS', status: 'solicitado', pendencies: 1 },
      ],
      initialExpectedVersion: 1,
    })
  })

  it('renders the decision reason dialog and delegates form actions', () => {
    const handleCancelDecisionReason = vi.fn()
    const handleConfirmDecisionReason = vi.fn()
    const handleDecisionReasonDialogOpenChange = vi.fn()
    const handleRemarksChange = vi.fn()
    useChecklistDossierTabMock.mockReturnValue(
      createController({
        handleCancelDecisionReason,
        handleConfirmDecisionReason,
        handleDecisionReasonDialogOpenChange,
        handleRemarksChange,
        isDecisionReasonDialogOpen: true,
        reasonError: 'Informe o motivo da decisão.',
      }),
    )

    render(
      <ChecklistDossierTab
        activities={[]}
        caseId='case-1'
        checklist={[{ id: '1', title: 'Procuração', status: 'validado' }]}
        expectedVersion={1}
      />,
    )

    expect(
      screen.getByRole('dialog', { name: 'Deseja aprovar com exceção?' }),
    ).toBeDefined()
    expect(screen.getByLabelText(/motivo da decisão/i).getAttribute('aria-invalid')).toBe(
      'true',
    )
    expect(screen.getByText('Informe o motivo da decisão.')).toBeDefined()

    fireEvent.change(screen.getByLabelText(/motivo da decisão/i), {
      target: { value: 'Exceção documental aprovada.' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar exceção' }))

    expect(handleRemarksChange).toHaveBeenCalledWith('Exceção documental aprovada.')
    expect(handleCancelDecisionReason).toHaveBeenCalledOnce()
    expect(handleConfirmDecisionReason).toHaveBeenCalledOnce()
  })
})
