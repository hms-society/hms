import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor, act } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { CaseChecklistGateDecision } from '@hms/core/case-management/domain/structures'
import { RestResponse } from '@hms/core/shared/responses/rest-response'

import { useCurrentCollaboratorQuery } from '@/ui/identity/hooks/use-current-collaborator-query'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { useChecklistDossierTab } from '../use-checklist-dossier-tab'

vi.mock('@/ui/identity/hooks/use-current-collaborator-query', () => ({
  useCurrentCollaboratorQuery: vi.fn(),
}))

vi.mock('@/ui/shared/hooks/use-rest-context', () => ({
  useRestContext: vi.fn(),
}))

vi.mock('@/ui/shared/hooks/use-navigation', () => ({
  useNavigation: vi.fn(),
}))

const useCurrentCollaboratorQueryMock = vi.mocked(useCurrentCollaboratorQuery)
const useNavigationMock = vi.mocked(useNavigation)
const useRestContextMock = vi.mocked(useRestContext)

describe('useChecklistDossierTab', () => {
  const navigateTo = vi.fn()
  const caseManagementService = {
    addComplementaryChecklistItem: vi.fn(),
    listCaseChecklist: vi.fn(),
    reviewChecklistGate: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    useCurrentCollaboratorQueryMock.mockReturnValue({
      currentCollaborator: {
        collaboratorId: 'collaborator-1',
        professionalName: 'João Pedro',
      },
      currentCollaboratorError: null,
      isLoadingCurrentCollaborator: false,
    } as never)
    useRestContextMock.mockReturnValue({
      caseManagementService,
    } as never)
    useNavigationMock.mockReturnValue({
      navigateTo,
      navigateCollaboratorsSearch: vi.fn(),
    })
    caseManagementService.listCaseChecklist.mockResolvedValue(
      new RestResponse({
        body: [],
        statusCode: 200,
      }),
    )
    caseManagementService.addComplementaryChecklistItem.mockResolvedValue(
      new RestResponse({
        body: {
          id: 'complementary-1',
          caseId: 'case-1',
          templateItemKey: 'complementary-item-1',
          title: 'Item complementar 1',
          isRequired: false,
          status: 'pending',
          createdAt: '2026-08-27T12:00:00.000Z',
          updatedAt: '2026-08-27T12:00:00.000Z',
        },
        statusCode: 201,
      }),
    )
  })

  afterEach(() => {
    vi.useRealTimers()
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
      remarks: 'CNIS será complementado por ofício já autorizado.',
    })
    await waitFor(() =>
      expect(result.current.checklistGateLabel).toBe('Aprovado com exceção'),
    )
    expect(result.current.checklistGateAuditLabel).toBe(
      'Decisão registrada por João Pedro em 24/08/2026 09:00',
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

  it('validates a pending document from the checklist action and records the validator', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-27T12:12:00.000Z'))
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
          checklist: [
            { id: '1', title: 'Procuração', status: 'validado' },
            {
              id: '2',
              title: 'Documento de Identificação Oficial',
              status: 'solicitado',
            },
          ],
        }),
      { wrapper },
    )

    expect(result.current.validatedItemsCount).toBe(1)
    expect(result.current.isChecklistComplete).toBe(false)

    act(() => {
      result.current.handleValidateChecklistItem('2')
    })

    expect(result.current.validatedItemsCount).toBe(2)
    expect(result.current.isChecklistComplete).toBe(true)
    expect(result.current.checklistItems[1]).toEqual(
      expect.objectContaining({
        documentName:
          'Documento de Identificação Oficial - validado por João Pedro hoje 09:12',
        status: 'validado',
      }),
    )
  })

  it('opens the persisted validation document instead of locally validating it', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    caseManagementService.listCaseChecklist.mockResolvedValue(
      new RestResponse({
        body: [
          {
            id: 'checklist-item-1',
            caseId: 'case-1',
            templateItemKey: 'procuracao-assinada',
            title: 'Procuração previdenciária assinada',
            isRequired: true,
            status: 'pending',
            documentFileId: 'document-file-1',
            documentFileName: 'pdf_teste_2_paginas.pdf',
            createdAt: '2026-08-27T12:00:00.000Z',
            updatedAt: '2026-08-27T12:00:00.000Z',
          },
        ],
        statusCode: 200,
      }),
    )

    const { result } = renderHook(
      () =>
        useChecklistDossierTab({
          caseId: 'case-1',
          checklist: [],
        }),
      { wrapper },
    )

    await waitFor(() =>
      expect(result.current.checklistItems[0]).toMatchObject({
        documentFileId: 'document-file-1',
        documentName: 'pdf_teste_2_paginas.pdf - aguardando validação documental',
        status: 'solicitado',
      }),
    )

    await act(async () => {
      await result.current.handleValidateChecklistItem('checklist-item-1')
    })

    expect(navigateTo).toHaveBeenCalledWith('documentAnalysis', {
      params: { fileId: 'document-file-1' },
    })
  })

  it('submits checklist approval after all documents are locally validated', async () => {
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
            decision: CaseChecklistGateDecision.Approved,
            decidedBy: 'collaborator-1',
            decidedAt: '2026-08-24T12:00:00.000Z',
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
            {
              id: '2',
              title: 'Documento de Identificação Oficial',
              status: 'solicitado',
            },
          ],
        }),
      { wrapper },
    )

    act(() => {
      result.current.handleValidateChecklistItem('2')
    })

    await result.current.handleApproveChecklist()

    expect(caseManagementService.reviewChecklistGate).toHaveBeenCalledWith('case-1', {
      decision: CaseChecklistGateDecision.Approved,
      remarks: undefined,
    })
    await waitFor(() => expect(result.current.checklistGateLabel).toBe('Aprovado'))
  })

  it('updates local checklist support actions with visible feedback', async () => {
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

    await act(async () => {
      await result.current.handleOpenValidationDesk()
    })
    expect(navigateTo).toHaveBeenCalledWith('documentInbox')

    await act(async () => {
      await result.current.handleFilterByCase()
    })
    expect(navigateTo).toHaveBeenCalledWith('documentInbox', {
      search: { caseId: 'case-1' },
    })

    await act(async () => {
      await result.current.handleAddComplementaryItem()
    })
    expect(result.current.complementaryItems).toEqual([
      'Item complementar 1 - adicionado por João Pedro',
    ])

    act(() => result.current.handleRequestDocumentException())
    expect(result.current.actionFeedback).toBe(
      'Solicitação de exceção documental registrada para análise de perfil autorizado.',
    )
  })

  it('does not submit checklist reviews while the case detail uses mock data', async () => {
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
          isReviewDisabled: true,
        }),
      { wrapper },
    )

    expect(result.current.isReviewDisabled).toBe(true)

    await expect(result.current.handleApproveChecklist()).rejects.toThrow(
      'A revisão deste checklist ainda não está disponível.',
    )
    expect(caseManagementService.reviewChecklistGate).not.toHaveBeenCalled()
  })
})
