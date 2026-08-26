import { useMemo, useState } from 'react'
import { isSameDay, isWithinInterval, startOfDay, endOfDay, format } from 'date-fns'
import type { DateRange } from 'react-day-picker'
import type { DocumentBatch } from '@hms/core/document-engine/domain/entities'
import { DocumentBatchChannel } from '@hms/core/document-engine/domain/structures'

import { useDocumentBatchesTriageQuery } from '@/ui/document-engine/hooks/use-document-batches-triage-query'
import { useDocumentValidationDocumentsQuery } from '@/ui/document-engine/hooks/use-document-validation-documents-query'
import type { IconName } from '@/ui/shared/widgets/components/icon'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'

type InboxDocument = {
  id: string
  fileName: string
  fileSize: string
  receivedFromIcon: IconName
  receivedFrom: string
  contactInfo: string
  caseId: string
  caseDesc: string
  receivedDate: string
  receivedTime: string
  status: string
  badgeClasses: string
  dotClasses: string
}

const ITEMS_PER_PAGE = 6

export function useDocumentInbox() {
  const { navigateTo } = useNavigation()
  const { batches, batchesError, isFetchingBatches, refetchBatches } =
    useDocumentBatchesTriageQuery()
  const {
    documents: rawValidationDocuments,
    documentsError: validationError,
    isFetchingDocuments: isFetchingValidation,
    refetchDocuments: refetchValidation,
  } = useDocumentValidationDocumentsQuery()

  const [currentPage, setCurrentPage] = useState(1)
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [appliedDateRange, setAppliedDateRange] = useState<DateRange | undefined>()
  const [statusFilter, setStatusFilter] = useState('')
  const [appliedStatusFilter, setAppliedStatusFilter] = useState('')
  const [clientFilter, setClientFilter] = useState('')
  const [appliedClientFilter, setAppliedClientFilter] = useState('')

  function parseDateString(dateStr: string) {
    const today = new Date()
    if (dateStr === 'Hoje') return today
    if (dateStr === 'Ontem') return new Date(today.getTime() - 24 * 60 * 60 * 1000)
    const [day, month, year] = dateStr.split('/')
    return new Date(Number(year), Number(month) - 1, Number(day))
  }

  function formatReceivedDate(date: Date) {
    const today = new Date()
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)

    if (isSameDay(date, today)) return 'Hoje'
    if (isSameDay(date, yesterday)) return 'Ontem'

    return format(date, 'dd/MM/yyyy')
  }

  function formatFileSize(sizeBytes: number) {
    if (sizeBytes < 1024 * 1024) {
      return `${Math.max(1, Math.round(sizeBytes / 1024))} KB`
    }

    return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`
  }

  function getStatusLabel(status: DocumentValidationDocument['status']) {
    const labels: Record<DocumentValidationDocument['status'], string> = {
      awaiting_validation: 'Aguardando validação',
      validated: 'Validado',
      not_linked: 'Não vinculado',
      illegible: 'Ilegível',
      incomplete: 'Incompleto',
      duplicate: 'Duplicado',
      not_corresponding: 'Não correspondente',
      processing_failure: 'Falha no processamento',
      resend_requested: 'Reenvio solicitado',
    }

    return labels[status]
  }

  function getStatusStyle(status: string) {
    if (status === 'Validado') {
      return {
        badgeClasses: 'bg-[#E8F5E9] text-[#1B5E20]',
        dotClasses: 'bg-[#2E7D32]',
      }
    }

    if (status === 'Ilegível') {
      return {
        badgeClasses: 'bg-[#FFEBEE] text-[#7B1515]',
        dotClasses: 'bg-[#A02822]',
      }
    }

    if (status === 'Incompleto' || status === 'Reenvio solicitado') {
      return {
        badgeClasses: 'bg-[#FFF3E0] text-[#7C4700]',
        dotClasses: 'bg-[#B36D32]',
      }
    }

    if (status === 'Falha no processamento') {
      return {
        badgeClasses: 'bg-destructive text-white',
        dotClasses: 'bg-white',
      }
    }

    if (status === 'Duplicado') {
      return {
        badgeClasses: 'bg-muted text-muted-foreground',
        dotClasses: 'bg-muted-foreground',
      }
    }

    return {
      badgeClasses: 'bg-[#E1F5F6] text-[#0F5C61]',
      dotClasses: 'bg-[#0FA0AA]',
    }
  }

  function getChannelIcon(channel: DocumentValidationDocument['channel']): IconName {
    if (channel === DocumentBatchChannel.WhatsApp) return 'message-square'
    if (channel === DocumentBatchChannel.Email) return 'mail'

    return 'help-circle'
  }

  function getChannelLabel(channel: DocumentValidationDocument['channel']) {
    if (channel === DocumentBatchChannel.WhatsApp) return 'WhatsApp'
    if (channel === DocumentBatchChannel.Email) return 'E-mail'

    return 'Portal do cliente'
  }

  function getSenderName(document: DocumentValidationDocument) {
    const titular = document.extractedFields.find((field) => field.label === 'Titular')

    return titular?.value ?? document.sender
  }

  function toInboxDocument(document: DocumentValidationDocument): InboxDocument {
    const status = getStatusLabel(document.status)
    const statusStyle = getStatusStyle(status)
    const checklistLink = document.checklistLink
    const receivedAt = new Date(document.receivedAt)

    return {
      id: document.id,
      fileName: document.fileName,
      fileSize: formatFileSize(document.sizeBytes),
      receivedFromIcon: getChannelIcon(document.channel),
      receivedFrom: getSenderName(document),
      contactInfo: `${getChannelLabel(document.channel)} · ${document.sender}`,
      caseId: checklistLink?.caseLabel ?? 'Sem vínculo seguro',
      caseDesc: checklistLink?.checklistItemLabel ?? 'Escolha manual necessária',
      receivedDate: formatReceivedDate(receivedAt),
      receivedTime: format(receivedAt, 'HH:mm'),
      status,
      badgeClasses: statusStyle.badgeClasses,
      dotClasses: statusStyle.dotClasses,
    }
  }

  function batchToInboxDocuments(batch: DocumentBatch): InboxDocument[] {
    const receivedAt = new Date(batch.createdAt)
    const statusLabel =
      batch.status === 'pending_identification' || batch.status === 'received'
        ? 'Aguardando validação'
        : 'Pendente'
    const statusStyle = getStatusStyle(statusLabel)
    const channel = batch.channel ?? DocumentBatchChannel.WhatsApp

    if (batch.files && batch.files.length > 0) {
      return batch.files.map((file) => ({
        id: file.id,
        fileName: file.originalName,
        fileSize: formatFileSize(file.sizeBytes),
        receivedFromIcon: getChannelIcon(channel),
        receivedFrom: batch.sender,
        contactInfo: `${getChannelLabel(channel)} · ${batch.sender}`,
        caseId: batch.readableId ?? 'Sem vínculo seguro',
        caseDesc: batch.clientId
          ? 'Titular pré-identificado'
          : 'Escolha manual necessária',
        receivedDate: formatReceivedDate(receivedAt),
        receivedTime: format(receivedAt, 'HH:mm'),
        status: statusLabel,
        badgeClasses: statusStyle.badgeClasses,
        dotClasses: statusStyle.dotClasses,
      }))
    }

    return [
      {
        id: batch.id,
        fileName: batch.readableId ?? 'Lote sem arquivos',
        fileSize: '0 KB',
        receivedFromIcon: getChannelIcon(channel),
        receivedFrom: batch.sender,
        contactInfo: `${getChannelLabel(channel)} · ${batch.sender}`,
        caseId: batch.readableId ?? 'Sem vínculo seguro',
        caseDesc: batch.clientId
          ? 'Titular pré-identificado'
          : 'Escolha manual necessária',
        receivedDate: formatReceivedDate(receivedAt),
        receivedTime: format(receivedAt, 'HH:mm'),
        status: statusLabel,
        badgeClasses: statusStyle.badgeClasses,
        dotClasses: statusStyle.dotClasses,
      },
    ]
  }

  const documents =
    batches.length > 0
      ? batches.flatMap(batchToInboxDocuments)
      : rawValidationDocuments.map(toInboxDocument)

  const uniqueStatuses = useMemo(
    () => Array.from(new Set(documents.map((item) => item.status))),
    [documents],
  )
  const uniqueClients = useMemo(
    () => Array.from(new Set(documents.map((item) => item.receivedFrom))),
    [documents],
  )

  const filteredData = documents.filter((item) => {
    if (appliedStatusFilter && item.status !== appliedStatusFilter) {
      return false
    }
    if (appliedClientFilter && item.receivedFrom !== appliedClientFilter) {
      return false
    }

    if (!appliedDateRange?.from) return true

    const itemDate = parseDateString(item.receivedDate)

    if (appliedDateRange.from && !appliedDateRange.to) {
      return isSameDay(itemDate, appliedDateRange.from)
    }

    if (appliedDateRange.from && appliedDateRange.to) {
      return isWithinInterval(itemDate, {
        start: startOfDay(appliedDateRange.from),
        end: endOfDay(appliedDateRange.to),
      })
    }

    return true
  })

  const totalItems = filteredData.length
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE))

  const paginatedData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  )

  function handlePageChange(page: number) {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  function handleApplyFilters() {
    setAppliedDateRange(dateRange)
    setAppliedStatusFilter(statusFilter)
    setAppliedClientFilter(clientFilter)
    setCurrentPage(1)
  }

  function handleClearFilters() {
    setDateRange(undefined)
    setAppliedDateRange(undefined)
    setStatusFilter('')
    setAppliedStatusFilter('')
    setClientFilter('')
    setAppliedClientFilter('')
    setCurrentPage(1)
  }

  async function handleAnalyze(fileId: string) {
    await navigateTo('documentAnalysis', { params: { fileId } })
  }

  async function handleRefresh() {
    await Promise.all([refetchBatches(), refetchValidation()])
  }

  return {
    currentPage,
    totalPages,
    totalItems,
    paginatedData,
    dateRange,
    setDateRange,
    statusFilter,
    setStatusFilter,
    clientFilter,
    setClientFilter,
    uniqueStatuses,
    uniqueClients,
    error: batchesError || validationError,
    isFetching: isFetchingBatches || isFetchingValidation,
    handlePageChange,
    handleAnalyze,
    handleRefresh,
    handleApplyFilters,
    handleClearFilters,
  }
}
