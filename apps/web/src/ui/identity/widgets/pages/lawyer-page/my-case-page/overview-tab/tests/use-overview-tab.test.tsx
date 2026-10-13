import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CaseTaskFaker } from '@hms/core/case-management/domain/entities/fakers'
import { CaseTaskStatus, CaseTaskType } from '@hms/core/case-management/domain/structures'
import { renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RestResponse } from '@hms/core/shared/responses/rest-response'

import { useNavigation } from '@/ui/shared/hooks/use-navigation'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { useOverviewTab } from '../use-overview-tab'

vi.mock('@/ui/shared/hooks/use-navigation', () => ({ useNavigation: vi.fn() }))
vi.mock('@/ui/shared/hooks/use-rest-context', () => ({ useRestContext: vi.fn() }))

const useNavigationMock = vi.mocked(useNavigation)
const useRestContextMock = vi.mocked(useRestContext)

describe('useOverviewTab', () => {
  const navigateTo = vi.fn()
  const caseManagementService = {
    listCaseTasks: vi.fn(),
    listCaseChecklist: vi.fn(),
    listCasePendings: vi.fn(),
    getPendingMessage: vi.fn(),
  }
  const documentValidationService = {
    listDocuments: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    caseManagementService.listCaseChecklist.mockResolvedValue(
      new RestResponse({ body: [], statusCode: 200 }),
    )
    caseManagementService.listCasePendings.mockResolvedValue(
      new RestResponse({ body: [], statusCode: 200 }),
    )
    caseManagementService.getPendingMessage.mockResolvedValue(
      new RestResponse({ body: undefined, statusCode: 200 }),
    )
    caseManagementService.listCaseTasks.mockResolvedValue(
      new RestResponse({ body: [], statusCode: 200 }),
    )
    documentValidationService.listDocuments.mockResolvedValue(
      new RestResponse({ body: [], statusCode: 200 }),
    )
    useNavigationMock.mockReturnValue({
      navigateCollaboratorsSearch: vi.fn(),
      navigateTo,
    })
    useRestContextMock.mockReturnValue({
      caseManagementService,
      documentValidationService,
    } as never)
  })

  it('shows active persisted document pendings and only labels messages by recorded status', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    caseManagementService.listCaseTasks.mockResolvedValue(
      new RestResponse({ body: [], statusCode: 200 }),
    )
    documentValidationService.listDocuments.mockResolvedValue(
      new RestResponse({ body: [], statusCode: 200 }),
    )
    caseManagementService.listCaseChecklist.mockResolvedValue(
      new RestResponse({
        body: [{ id: 'item-1', title: 'Documento de identificação', caseId: 'case-1' }],
        statusCode: 200,
      }),
    )
    caseManagementService.listCasePendings.mockResolvedValue(
      new RestResponse({
        body: [
          {
            id: 'pending-1',
            caseId: 'case-1',
            checklistItemId: 'item-1',
            reason: 'illegible',
            documentFileName: 'rg-frente.pdf',
            createdAt: new Date('2026-10-08T12:00:00.000Z'),
          },
          {
            id: 'pending-cancelled',
            caseId: 'case-1',
            checklistItemId: 'item-2',
            reason: 'missing',
            createdAt: new Date('2026-10-08T11:00:00.000Z'),
            cancelledAt: new Date('2026-10-08T13:00:00.000Z'),
          },
        ],
        statusCode: 200,
      }),
    )
    caseManagementService.getPendingMessage.mockResolvedValue(
      new RestResponse({
        body: {
          id: 'message-1',
          pendingId: 'pending-1',
          caseId: 'case-1',
          checklistItemId: 'item-1',
          subject: 'Reenvio de documento',
          body: 'O documento está ilegível. Envie uma nova cópia.',
          status: 'awaiting_approval',
          createdAt: '2026-10-08T12:05:00.000Z',
          updatedAt: '2026-10-08T12:05:00.000Z',
        },
        statusCode: 200,
      }),
    )

    const { result } = renderHook(() => useOverviewTab({ caseId: 'case-1' }), { wrapper })

    await waitFor(() => expect(result.current.documentPendings).toHaveLength(1))
    expect(result.current.documentPendings).toHaveLength(1)
    expect(result.current.documentPendings[0]).toMatchObject({
      checklistItemId: 'item-1',
      documentFileName: 'rg-frente.pdf',
      messageStatusLabel: 'Mensagem aguardando aprovação',
      reasonLabel: 'Documento ilegível',
      title: 'Documento de identificação',
    })
    expect(result.current.documentPendings[0]?.messageStatusLabel).not.toContain(
      'enviada',
    )

    result.current.handleOpenChecklistItem('item-1')
    expect(navigateTo).toHaveBeenCalledWith('lawyerCaseChecklistItem', {
      params: { caseId: 'case-1', checklistItemId: 'item-1' },
    })
  })

  it('prioritizes persisted deadlines and tasks according to REQ-014', async () => {
    caseManagementService.listCaseChecklist.mockResolvedValue(
      new RestResponse({ body: [], statusCode: 200 }),
    )
    caseManagementService.listCasePendings.mockResolvedValue(
      new RestResponse({ body: [], statusCode: 200 }),
    )
    documentValidationService.listDocuments.mockResolvedValue(
      new RestResponse({ body: [], statusCode: 200 }),
    )
    const overdueDeadline = CaseTaskFaker.fake({
      id: 'overdue-deadline',
      type: CaseTaskType.ProcessDeadline,
      plannedDate: '2026-10-07',
    })
    const upcomingDeadline = CaseTaskFaker.fake({
      id: 'upcoming-deadline',
      type: CaseTaskType.Hearing,
      plannedDate: '2026-10-10',
    })
    const overdueTask = CaseTaskFaker.fake({
      id: 'overdue-task',
      type: CaseTaskType.InternalTask,
      plannedDate: '2026-10-08',
    })
    const assignedTask = CaseTaskFaker.fake({
      id: 'assigned-task',
      type: CaseTaskType.InternalTask,
      plannedDate: '2026-10-11',
      assigneeIds: ['current-user'],
    })
    const completedTask = CaseTaskFaker.fake({
      id: 'completed-task',
      status: CaseTaskStatus.Completed,
      plannedDate: '2026-10-06',
    })
    caseManagementService.listCaseTasks.mockResolvedValue(
      new RestResponse({
        body: [
          assignedTask,
          overdueTask,
          upcomingDeadline,
          overdueDeadline,
          completedTask,
        ],
        statusCode: 200,
      }),
    )
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    const { result } = renderHook(
      () =>
        useOverviewTab({
          caseId: 'case-1',
          currentCollaboratorId: 'current-user',
          today: '2026-10-09',
        }),
      { wrapper },
    )

    await waitFor(() =>
      expect(result.current.priorityItems.map((item) => item.id)).toEqual([
        'overdue-deadline',
        'upcoming-deadline',
        'overdue-task',
      ]),
    )
  })

  it('shows inferred document issues and assisted message drafts when no active pending is persisted', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    caseManagementService.listCaseChecklist.mockResolvedValue(
      new RestResponse({
        body: [
          {
            id: 'item-illegible',
            caseId: 'case-1',
            templateItemKey: 'identity',
            title: 'Documento de identificação',
            isRequired: true,
            status: 'in_analysis',
            documentFileId: 'file-illegible',
            documentFileName: 'rg-frente.pdf',
            createdAt: new Date('2026-10-08T10:00:00.000Z'),
            updatedAt: new Date('2026-10-08T10:00:00.000Z'),
          },
        ],
        statusCode: 200,
      }),
    )
    caseManagementService.listCasePendings.mockResolvedValue(
      new RestResponse({ body: [], statusCode: 200 }),
    )
    documentValidationService.listDocuments.mockResolvedValue(
      new RestResponse({
        body: [
          {
            id: 'file-illegible',
            batchId: 'batch-1',
            fileName: 'rg-frente.pdf',
            mimeType: 'application/pdf',
            sizeBytes: 100,
            storagePath: 'rg-frente.pdf',
            status: 'illegible',
            channel: 'email',
            sender: 'client@example.com',
            receivedAt: new Date('2026-10-08T09:00:00.000Z'),
            createdAt: new Date('2026-10-08T09:00:00.000Z'),
            reviewedAt: new Date('2026-10-08T09:30:00.000Z'),
            extractedFields: [],
            missingFields: [],
            checklistLink: { caseId: 'case-1', checklistItemId: 'item-illegible' },
          },
        ],
        statusCode: 200,
      }),
    )

    const { result } = renderHook(() => useOverviewTab({ caseId: 'case-1' }), { wrapper })

    await waitFor(() => expect(result.current.documentPendings).toHaveLength(1))
    expect(result.current.documentPendings[0]).toMatchObject({
      checklistItemId: 'item-illegible',
      documentFileName: 'rg-frente.pdf',
      messageStatusLabel: 'Mensagem assistida aguardando aprovação',
      reasonLabel: 'Ilegível',
      title: 'Documento de identificação',
    })
    expect(result.current.documentPendings[0]?.messagePreview).toContain(
      'rg-frente.pdf recebido está ilegível',
    )
    expect(caseManagementService.getPendingMessage).not.toHaveBeenCalled()
  })
})
