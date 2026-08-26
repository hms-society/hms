import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor, act } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CaseChecklistGateDecision } from '@hms/core/case-management/domain/structures'
import { RestResponse } from '@hms/core/shared/responses/rest-response'

import { useCurrentCollaboratorQuery } from '@/ui/identity/hooks/use-current-collaborator-query'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { useChecklistDossierTab } from '../use-checklist-dossier-tab'

vi.mock('@/ui/shared/hooks/use-rest-context', () => ({
  useRestContext: vi.fn(),
}))

vi.mock('@/ui/identity/hooks/use-current-collaborator-query', () => ({
  useCurrentCollaboratorQuery: vi.fn(),
}))

const useRestContextMock = vi.mocked(useRestContext)
const useCurrentCollaboratorQueryMock = vi.mocked(useCurrentCollaboratorQuery)

describe('useChecklistDossierTab', () => {
  const caseManagementService = {
    reviewChecklistGate: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    useRestContextMock.mockReturnValue({
      caseManagementService,
    } as never)
    useCurrentCollaboratorQueryMock.mockReturnValue({
      currentCollaborator: { collaboratorId: 'collaborator-1' },
      currentCollaboratorError: null,
      isLoadingCurrentCollaborator: false,
    } as never)
  })

  it('approves the checklist with exception and keeps the dossier gate locked', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    caseManagementService.reviewChecklistGate.mockResolvedValue(
      new RestResponse({
        body: {
          id: 'case-1',
          status: 'ready_for_legal_production',
          checklistGate: {
            decision: CaseChecklistGateDecision.ApprovedWithException,
            decidedBy: 'collaborator-1',
            decidedAt: '2026-08-24T12:00:00.000Z',
            remarks: 'CNIS será complementado por ofício já autorizado.',
          },
          dossierGate: {},
        },
        statusCode: 200,
      }),
    )

    const { result } = renderHook(
      () =>
        useChecklistDossierTab({
          caseId: 'case-1',
          checklist: [
            { id: '1', title: 'Procuração', status: 'validado' },
            { id: '2', title: 'CNIS', status: 'solicitado', pendencies: 1 },
          ],
        }),
      { wrapper },
    )

    act(() => result.current.handleApproveWithException())

    expect(result.current.isDecisionReasonDialogOpen).toBe(true)
    expect(result.current.decisionReasonDialog.title).toBe('Deseja aprovar com exceção?')

    act(() => {
      result.current.handleRemarksChange(
        'CNIS será complementado por ofício já autorizado.',
      )
    })

    await result.current.handleConfirmDecisionReason()

    expect(caseManagementService.reviewChecklistGate).toHaveBeenCalledWith('case-1', {
      decision: CaseChecklistGateDecision.ApprovedWithException,
      decidedBy: 'collaborator-1',
      remarks: 'CNIS será complementado por ofício já autorizado.',
    })
    await waitFor(() =>
      expect(result.current.checklistGateLabel).toBe('Aprovado com exceção'),
    )
    expect(result.current.dossierGateLabel).toBe('Dossiê pendente')
    expect(result.current.canStartLegalWriting).toBe(false)
    expect(result.current.isDecisionReasonDialogOpen).toBe(false)
  })

  it('requires a decision reason before submitting justified decisions', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    const { result } = renderHook(
      () =>
        useChecklistDossierTab({
          caseId: 'case-1',
          checklist: [{ id: '1', title: 'Procuração', status: 'validado' }],
        }),
      { wrapper },
    )

    act(() => result.current.handleRejectOnMerit())

    await act(async () => {
      await result.current.handleConfirmDecisionReason()
    })

    expect(result.current.reasonError).toBe('Informe o motivo da decisão.')
    expect(caseManagementService.reviewChecklistGate).not.toHaveBeenCalled()
  })
})
