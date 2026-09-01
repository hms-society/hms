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
    actionFeedback: null,
    canStartLegalWriting: false,
    checklistGateAuditLabel: undefined,
    checklistGateLabel: 'Checklist pendente',
    checklistGateRemarks: undefined,
    checklistItems: [
      { id: '1', title: 'Procuração', status: 'validado' },
      { id: '2', title: 'CNIS', status: 'solicitado', pendencies: 1 },
    ],
    complementaryItems: [],
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
    handleAddComplementaryItem: vi.fn(),
    handleFilterByCase: vi.fn(),
    handleOpenValidationDesk: vi.fn(),
    handleRejectOnMerit: vi.fn(),
    handleRemarksChange: vi.fn(),
    handleRequestDocumentException: vi.fn(),
    handleValidateChecklistItem: vi.fn(),
    isDecisionReasonDialogOpen: false,
    isChecklistComplete: false,
    isReviewDisabled: false,
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
      isReviewDisabled: false,
    })
  })

  it('keeps checklist review actions disabled while case data is mocked', () => {
    useChecklistDossierTabMock.mockReturnValue(
      createController({
        isChecklistComplete: true,
        isReviewDisabled: true,
      }),
    )

    render(
      <ChecklistDossierTab
        activities={[]}
        caseId='case-1'
        checklist={[{ id: '1', title: 'Procuração', status: 'validado' }]}
        isReviewDisabled
        reviewDisabledReason='A revisão depende do detalhe real do caso.'
      />,
    )

    expect(screen.getByText('A revisão depende do detalhe real do caso.')).toBeTruthy()
    expect(
      screen.getByRole('button', { name: /aprovar checklist/i }).hasAttribute('disabled'),
    ).toBe(true)
    expect(useChecklistDossierTabMock).toHaveBeenCalledWith({
      caseId: 'case-1',
      checklist: [{ id: '1', title: 'Procuração', status: 'validado' }],
      isReviewDisabled: true,
    })
  })

  it('delegates checklist item validation from the row action button', () => {
    const handleValidateChecklistItem = vi.fn()
    useChecklistDossierTabMock.mockReturnValue(
      createController({ handleValidateChecklistItem }),
    )

    render(
      <ChecklistDossierTab
        activities={[]}
        caseId='case-1'
        checklist={[
          { id: '1', title: 'Procuração', status: 'validado' },
          { id: '2', title: 'CNIS', status: 'solicitado', pendencies: 1 },
        ]}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /validar cnis/i }))

    expect(handleValidateChecklistItem).toHaveBeenCalledWith('2')
  })

  it('renders the locally validated document audit line', () => {
    useChecklistDossierTabMock.mockReturnValue(
      createController({
        checklistItems: [
          {
            documentName: 'CNIS - validado por João Pedro hoje 09:12',
            id: '2',
            status: 'validado',
            title: 'CNIS',
          },
        ],
        isChecklistComplete: true,
        mandatoryItemsCount: 1,
        pendingItemsCount: 0,
        validatedItemsCount: 1,
      }),
    )

    render(
      <ChecklistDossierTab
        activities={[]}
        caseId='case-1'
        checklist={[{ id: '2', title: 'CNIS', status: 'solicitado' }]}
      />,
    )

    expect(screen.getByText('CNIS - validado por João Pedro hoje 09:12')).toBeTruthy()
    expect(screen.getByText('1 de 1 obrigatórios - 100%')).toBeTruthy()
  })

  it('renders the checklist gate audit line after a review decision', () => {
    useChecklistDossierTabMock.mockReturnValue(
      createController({
        checklistGateAuditLabel: 'Decisão registrada por João Pedro em 24/08/2026 09:00',
        checklistGateLabel: 'Aprovado com exceção',
        checklistGateRemarks: 'CNIS será complementado.',
      }),
    )

    render(
      <ChecklistDossierTab
        activities={[]}
        caseId='case-1'
        checklist={[{ id: '1', title: 'Procuração', status: 'validado' }]}
      />,
    )

    expect(screen.getByText('Aprovado com exceção')).toBeTruthy()
    expect(screen.getByText('Ressalvas: CNIS será complementado.')).toBeTruthy()
    expect(
      screen.getByText('Decisão registrada por João Pedro em 24/08/2026 09:00'),
    ).toBeTruthy()
  })

  it('delegates support actions and renders visible action feedback', () => {
    const handleAddComplementaryItem = vi.fn()
    const handleFilterByCase = vi.fn()
    const handleOpenValidationDesk = vi.fn()
    const handleRequestDocumentException = vi.fn()
    useChecklistDossierTabMock.mockReturnValue(
      createController({
        actionFeedback: 'Filtro do caso aplicado ao checklist documental.',
        complementaryItems: ['Item complementar 1 - adicionado por João Pedro'],
        handleAddComplementaryItem,
        handleFilterByCase,
        handleOpenValidationDesk,
        handleRequestDocumentException,
      }),
    )

    render(
      <ChecklistDossierTab
        activities={[]}
        caseId='case-1'
        checklist={[{ id: '1', title: 'Procuração', status: 'validado' }]}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /mesa de validação/i }))
    fireEvent.click(screen.getByRole('button', { name: /filtrado por este caso/i }))
    fireEvent.click(screen.getByRole('button', { name: /adicionar item/i }))
    fireEvent.click(screen.getByRole('button', { name: /solicitar exceção documental/i }))

    expect(
      screen.getByText('Filtro do caso aplicado ao checklist documental.'),
    ).toBeTruthy()
    expect(
      screen.getByText('Item complementar 1 - adicionado por João Pedro'),
    ).toBeTruthy()
    expect(handleOpenValidationDesk).toHaveBeenCalledOnce()
    expect(handleFilterByCase).toHaveBeenCalledOnce()
    expect(handleAddComplementaryItem).toHaveBeenCalledOnce()
    expect(handleRequestDocumentException).toHaveBeenCalledOnce()
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
