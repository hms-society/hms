import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ChecklistDossierTab } from '..'
import { useListCaseDocumentExceptionsQuery } from '@/ui/document-engine/hooks/use-list-case-document-exceptions-query'
import { useCurrentCollaboratorQuery } from '@/ui/identity/hooks/use-current-collaborator-query'
import { useChecklistDossierTab } from '../use-checklist-dossier-tab'

vi.mock('../use-checklist-dossier-tab', () => ({
  useChecklistDossierTab: vi.fn(),
}))

vi.mock('@/ui/document-engine/hooks/use-list-case-document-exceptions-query', () => ({
  useListCaseDocumentExceptionsQuery: vi.fn(() => ({ exceptions: [] })),
}))

vi.mock('@/ui/identity/hooks/use-current-collaborator-query', () => ({
  useCurrentCollaboratorQuery: vi.fn(() => ({ currentCollaborator: null })),
}))

vi.mock('@/ui/document-engine/hooks/use-approve-document-exception-action', () => ({
  useApproveDocumentExceptionAction: vi.fn(() => ({
    approveException: vi.fn(),
    isApprovingException: false,
  })),
}))

vi.mock('@/ui/document-engine/hooks/use-reject-document-exception-action', () => ({
  useRejectDocumentExceptionAction: vi.fn(() => ({
    rejectException: vi.fn(),
    isRejectingException: false,
  })),
}))

const useChecklistDossierTabMock = vi.mocked(useChecklistDossierTab)
const useListCaseDocumentExceptionsQueryMock = vi.mocked(
  useListCaseDocumentExceptionsQuery,
)
const useCurrentCollaboratorQueryMock = vi.mocked(useCurrentCollaboratorQuery)

function createController(
  overrides: Partial<ReturnType<typeof useChecklistDossierTab>> = {},
): ReturnType<typeof useChecklistDossierTab> {
  const mandatoryItemsCount = overrides.mandatoryItemsCount ?? 2
  const validatedItemsCount = overrides.validatedItemsCount ?? 1
  const isChecklistComplete = overrides.isChecklistComplete ?? false
  return {
    actionFeedback: null,
    canStartLegalWriting: false,
    canHomologateDossier: false,
    checklistGateAuditLabel: undefined,
    checklistGateLabel: 'Checklist pendente',
    checklistGateRemarks: undefined,
    checklistItems: [
      { id: '1', title: 'Procuração', status: 'validado' },
      { id: '2', title: 'CNIS', status: 'solicitado' },
    ],
    pendingCountByChecklistItemId: new Map(),
    pendings: [],
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
    handleHomologateDossier: vi.fn(),
    hasChecklistDecision: false,
    handleOpenChecklistItemDetail: vi.fn(),
    handleOpenValidationDesk: vi.fn(),
    handleRejectOnMerit: vi.fn(),
    handleRemarksChange: vi.fn(),
    handleRequestDocumentException: vi.fn(),
    handleValidateChecklistItem: vi.fn(),
    isDecisionReasonDialogOpen: false,
    isChecklistComplete,
    isExceptionModalOpen: false,
    isRequestingException: false,
    isReviewDisabled: false,
    isReviewingChecklistGate: false,
    isHomologatingDossier: false,
    mandatoryItemsCount,
    pendingItemsCount: 1,
    reasonError: null,
    remarks: '',
    requestException: vi.fn(),
    setIsExceptionModalOpen: vi.fn(),
    validatedItemsCount,
    ...overrides,
  }
}

describe('ChecklistDossierTab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useListCaseDocumentExceptionsQueryMock.mockReturnValue({ exceptions: [] } as never)
    useCurrentCollaboratorQueryMock.mockReturnValue({
      currentCollaborator: null,
    } as never)
  })
  afterEach(cleanup)
  afterEach(() => vi.useRealTimers())

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
          { id: '2', title: 'CNIS', status: 'solicitado' },
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
        { id: '2', title: 'CNIS', status: 'solicitado' },
      ],
      isReviewDisabled: false,
    })
  })

  it('hides the pending validation message when an approved exception unlocks the dossier', () => {
    useChecklistDossierTabMock.mockReturnValue(
      createController({
        canHomologateDossier: true,
        checklistGateLabel: 'Aprovado com exceção',
      }),
    )

    vi.mocked(useListCaseDocumentExceptionsQuery).mockReturnValue({
      exceptions: [{ id: 'exception-1', status: 'APPROVED' }],
    } as never)

    render(
      <ChecklistDossierTab
        activities={[]}
        caseId='case-1'
        checklist={[{ id: '1', title: 'Procuração', status: 'solicitado' }]}
      />,
    )

    expect(
      screen.queryByText(/itens ainda exigem validação ou exceção autorizada/i),
    ).toBeNull()
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

  it('keeps case content readable while hiding checklist mutations in read-only mode', () => {
    useChecklistDossierTabMock.mockReturnValue(
      createController({
        checklistItems: [
          {
            documentFileId: 'file-1',
            id: '1',
            status: 'solicitado',
            title: 'CNIS',
          },
        ],
      }),
    )

    render(
      <ChecklistDossierTab
        activities={[]}
        caseId='case-1'
        checklist={[
          {
            documentFileId: 'file-1',
            id: '1',
            status: 'solicitado',
            title: 'CNIS',
          },
        ]}
        readOnly
      />,
    )

    expect(screen.getByText('CNIS')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Ver documento' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: /aprovar checklist/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /adicionar item/i })).toBeNull()
    expect(
      screen.queryByRole('button', { name: /solicitar exceção documental/i }),
    ).toBeNull()
    expect(screen.queryByRole('button', { name: /mesa de validação/i })).toBeNull()
    expect(useChecklistDossierTabMock).toHaveBeenCalledWith({
      caseId: 'case-1',
      checklist: [
        {
          documentFileId: 'file-1',
          id: '1',
          status: 'solicitado',
          title: 'CNIS',
        },
      ],
      isReviewDisabled: true,
    })
  })

  it('delegates checklist item validation from the row action button', () => {
    const handleValidateChecklistItem = vi.fn()
    const handleOpenChecklistItemDetail = vi.fn()
    useChecklistDossierTabMock.mockReturnValue(
      createController({
        checklistItems: [
          { id: '1', title: 'Procuração', status: 'validado' },
          {
            documentFileId: 'document-file-1',
            documentName: 'cnis.pdf - aguardando validação documental',
            id: '2',
            status: 'solicitado',
            title: 'CNIS',
          },
        ],
        handleOpenChecklistItemDetail,
        handleValidateChecklistItem,
      }),
    )

    render(
      <ChecklistDossierTab
        activities={[]}
        caseId='case-1'
        checklist={[
          { id: '1', title: 'Procuração', status: 'validado' },
          { id: '2', title: 'CNIS', status: 'solicitado' },
        ]}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /ver documento/i }))

    expect(handleValidateChecklistItem).toHaveBeenCalledWith('2')

    fireEvent.click(screen.getByRole('button', { name: /abrir cnis/i }))

    expect(handleOpenChecklistItemDetail).toHaveBeenCalledWith('2')
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

  it('renders exception cards, authorized decisions, and rejection details', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-08T12:00:00.000Z'))
    useListCaseDocumentExceptionsQueryMock.mockReturnValue({
      exceptions: [
        {
          deadlineDate: '2026-10-09T12:00:00.000Z',
          documentId: 'missing-document',
          id: 'pending-exception',
          rejectionJustification: null,
          status: 'PENDING',
          type: 'ACEITE_PROVISORIO',
        },
        {
          deadlineDate: null,
          documentId: 'missing-document',
          id: 'rejected-exception',
          rejectionJustification: 'Documento ilegível.',
          status: 'REJECTED',
          type: 'DISPENSA_DEFINITIVA',
        },
      ],
    } as never)
    useCurrentCollaboratorQueryMock.mockReturnValue({
      currentCollaborator: { collaboratorId: 'supervisor-1', profile: 'supervisor' },
    } as never)
    useChecklistDossierTabMock.mockReturnValue(createController())

    render(<ChecklistDossierTab activities={[]} caseId='case-1' checklist={[]} />)

    expect(screen.getAllByText('Documento não identificado')).toHaveLength(2)
    expect(screen.getByText('Aceite provisório')).toBeTruthy()
    expect(screen.getByText('Dispensa definitiva')).toBeTruthy()
    expect(screen.getByText(/No prazo até/)).toBeTruthy()
    expect(screen.getByText('Reprovado')).toBeTruthy()
    expect(screen.getAllByRole('button', { name: 'Aprovar' })).toHaveLength(1)
    expect(screen.getAllByRole('button', { name: 'Recusar' })).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: 'Aprovar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Recusar' }))

    fireEvent.click(screen.getAllByText('Documento não identificado')[1])

    expect(screen.getByRole('dialog', { name: 'Motivo da Recusa' })).toBeTruthy()
    expect(screen.getByText('Documento ilegível.')).toBeTruthy()
  })

  it('hides pending exception decisions from collaborators without approval access', () => {
    useListCaseDocumentExceptionsQueryMock.mockReturnValue({
      exceptions: [
        {
          deadlineDate: null,
          documentId: '2',
          id: 'pending-exception',
          rejectionJustification: null,
          status: 'PENDING',
          type: 'DISPENSA_DEFINITIVA',
        },
      ],
    } as never)
    useChecklistDossierTabMock.mockReturnValue(createController())

    render(<ChecklistDossierTab activities={[]} caseId='case-1' checklist={[]} />)

    expect(screen.getByText('Dispensa definitiva')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Aprovar' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Recusar' })).toBeNull()
  })

  it('renders the empty checklist state and gate service error', () => {
    useChecklistDossierTabMock.mockReturnValue(
      createController({
        checklistItems: [],
        error: new Error('Falha ao revisar gate.'),
        mandatoryItemsCount: 0,
        pendingItemsCount: 0,
        validatedItemsCount: 0,
      }),
    )

    render(<ChecklistDossierTab activities={[]} caseId='case-1' checklist={[]} />)

    expect(
      screen.getByText('Nenhum checklist documental foi encontrado para este caso'),
    ).toBeTruthy()
    expect(
      screen.getByText(
        'Nenhum item de checklist documental foi encontrado para este caso.',
      ),
    ).toBeTruthy()
    expect(screen.getByText('Falha ao revisar gate.')).toBeTruthy()
  })
})
