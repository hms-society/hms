import { useQuery } from '@tanstack/react-query'
import type {
  AssistedMessage,
  CaseTask,
  Pending,
} from '@hms/core/case-management/domain/entities'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { getChecklistItemDetailView } from '../checklist-item-detail-page/checklist-item-detail-view'

type UseOverviewTabParams = {
  caseId?: string
  currentCollaboratorId?: string
  today?: string
}

export type OverviewPriorityItem = CaseTask & {
  isOverdue: boolean
  isAssignedToCurrentUser: boolean
  typeLabel: string
  statusLabel: string
  plannedDateLabel: string
}

export type OverviewDocumentPending = {
  id: string
  checklistItemId: string
  createdAt: Date
  documentFileName?: string
  messageStatusLabel?: string
  messagePreview?: string
  reasonLabel: string
  title: string
}

export function useOverviewTab({
  caseId,
  currentCollaboratorId,
  today = new Date().toISOString().slice(0, 10),
}: UseOverviewTabParams) {
  const { caseManagementService, documentValidationService } = useRestContext()
  const { navigateTo } = useNavigation()
  const {
    data: persistedCaseTasks = [],
    error: caseTasksError,
    isLoading: isLoadingCaseTasks,
  } = useQuery({
    queryKey: ['case-management', 'cases', caseId, 'tasks'],
    queryFn: async () => {
      if (!caseId) return []
      const response = await caseManagementService.listCaseTasks(caseId)
      if (response.isFailure) response.throwError()
      return response.body
    },
    enabled: Boolean(caseId),
  })
  const {
    data: documentPendings = [],
    error: documentPendingsError,
    isLoading: isLoadingDocumentPendings,
  } = useQuery({
    queryKey: ['case-management', 'cases', caseId, 'overview-document-pendings'],
    queryFn: async () => {
      if (!caseId) return []
      const [checklistResponse, pendingsResponse, documentsResponse] = await Promise.all([
        caseManagementService.listCaseChecklist(caseId),
        caseManagementService.listCasePendings(caseId),
        documentValidationService.listDocuments({ caseId }),
      ])
      if (checklistResponse.isFailure) checklistResponse.throwError()
      if (pendingsResponse.isFailure) pendingsResponse.throwError()
      if (documentsResponse.isFailure) documentsResponse.throwError()
      const activePendings = pendingsResponse.body.filter(
        (pending) => !pending.cancelledAt,
      )
      const pendingMessages = await Promise.all(
        activePendings.map(async (pending) => {
          const response = await caseManagementService.getPendingMessage(pending.id)
          if (response.isFailure) response.throwError()
          return { pending, message: response.body }
        }),
      )
      const persistedDocumentPendings = pendingMessages.map(({ pending, message }) => {
        const checklistItem = checklistResponse.body.find(
          (item) => item.id === pending.checklistItemId,
        )
        return {
          id: pending.id,
          checklistItemId: pending.checklistItemId,
          createdAt: toValidDate(pending.createdAt),
          documentFileName: pending.documentFileName,
          messageStatusLabel: message ? getPendingMessageStatusLabel(message) : undefined,
          messagePreview: message?.body,
          reasonLabel: getPendingReasonLabel(pending.reason),
          title:
            checklistItem?.title ?? pending.documentFileName ?? 'Pendência documental',
        }
      })
      const activeChecklistItemIds = new Set(
        activePendings.map((pending) => pending.checklistItemId),
      )
      const inferredDocumentPendings = checklistResponse.body
        .filter((item) => !activeChecklistItemIds.has(item.id))
        .flatMap((item, index) => {
          const document = documentsResponse.body.find(
            (currentDocument) =>
              currentDocument.id === item.documentFileId ||
              currentDocument.checklistLink?.checklistItemId === item.id,
          )
          const detailView = getChecklistItemDetailView({
            caseId,
            checklistItem: item,
            document,
            documentLogs: [],
            pendings: [],
            itemIndex: index,
            totalItemsCount: checklistResponse.body.length,
          })

          return detailView.pendingItems.map((pending) => ({
            id: pending.id,
            checklistItemId: item.id,
            createdAt: toValidDate(document?.reviewedAt ?? item.createdAt),
            documentFileName: pending.documentFileName,
            messageStatusLabel: 'Mensagem assistida aguardando aprovação',
            messagePreview: pending.body,
            reasonLabel: pending.description,
            title: item.title,
          }))
        })

      return [...persistedDocumentPendings, ...inferredDocumentPendings].sort(
        (first, second) => second.createdAt.getTime() - first.createdAt.getTime(),
      )
    },
    enabled: Boolean(caseId),
  })

  const priorityItems = getPriorityItems(persistedCaseTasks, currentCollaboratorId, today)

  function handleOpenChecklistItem(checklistItemId: string) {
    if (!caseId) return
    void navigateTo('lawyerCaseChecklistItem', {
      params: { caseId, checklistItemId },
    })
  }

  return {
    documentPendings,
    documentPendingsError,
    isLoadingDocumentPendings,
    caseTasksError,
    isLoadingCaseTasks,
    priorityItems,
    handleOpenChecklistItem,
  }
}

function getPriorityItems(
  caseTasks: readonly CaseTask[],
  currentCollaboratorId: string | undefined,
  today: string,
): OverviewPriorityItem[] {
  const openTasks = caseTasks.filter(
    (task) => task.status !== 'completed' && !task.deletedAt,
  )
  const deadlines = openTasks.filter((task) => task.type !== 'internal_task')
  const overdueDeadlines = deadlines
    .filter((task) => task.plannedDate < today)
    .sort(comparePlannedDate)
  const upcomingDeadlines = deadlines
    .filter((task) => task.plannedDate >= today)
    .sort(comparePlannedDate)
  const overdueTasks = openTasks
    .filter(
      (task) =>
        task.type === 'internal_task' && task.plannedDate && task.plannedDate < today,
    )
    .sort(comparePlannedDate)
  const userTasks = openTasks
    .filter(
      (task) =>
        task.type === 'internal_task' &&
        task.assigneeIds.includes(currentCollaboratorId ?? '') &&
        !overdueTasks.some((overdueTask) => overdueTask.id === task.id),
    )
    .sort(comparePlannedDate)
  const blockingTasks = openTasks
    .filter(
      (task) =>
        task.type === 'internal_task' &&
        task.blocksCaseClosure &&
        !overdueTasks.some((overdueTask) => overdueTask.id === task.id) &&
        !userTasks.some((userTask) => userTask.id === task.id),
    )
    .sort(comparePlannedDate)

  return [
    ...overdueDeadlines,
    ...upcomingDeadlines,
    ...overdueTasks,
    ...userTasks,
    ...blockingTasks,
  ]
    .slice(0, 3)
    .map((task) => ({
      ...task,
      isOverdue: Boolean(task.plannedDate && task.plannedDate < today),
      isAssignedToCurrentUser: task.assigneeIds.includes(currentCollaboratorId ?? ''),
      typeLabel: task.type === 'internal_task' ? 'Tarefa interna' : 'Prazo jurídico',
      statusLabel: task.status === 'in_progress' ? 'Em andamento' : 'Em aberto',
      plannedDateLabel: formatPlannedDate(task.plannedDate),
    }))
}

function comparePlannedDate(first: CaseTask, second: CaseTask) {
  return first.plannedDate.localeCompare(second.plannedDate)
}

function formatPlannedDate(plannedDate: string) {
  const [year, month, day] = plannedDate.split('-')
  return year && month && day ? `${day}/${month}/${year}` : plannedDate
}

function toValidDate(value: Date | string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? new Date(0) : date
}

function getPendingMessageStatusLabel(message: AssistedMessage) {
  if (message.status === 'sent') {
    const sentAt = message.sentAt ? ` em ${formatSentAt(message.sentAt)}` : ''
    return `Mensagem enviada${sentAt}`
  }
  if (message.status === 'awaiting_approval') return 'Mensagem aguardando aprovação'
  if (message.status === 'approved') return 'Mensagem aprovada para envio'
  return 'Mensagem cancelada'
}

function formatSentAt(sentAt: Date | string) {
  const date = new Date(sentAt)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

function getPendingReasonLabel(reason: Pending['reason']) {
  const labels: Record<Pending['reason'], string> = {
    illegible: 'Documento ilegível',
    missing: 'Documento ausente',
    incomplete: 'Documento incompleto',
    duplicate: 'Documento duplicado',
    not_corresponding: 'Documento não correspondente',
  }
  return labels[reason] ?? 'Documento com pendência'
}
