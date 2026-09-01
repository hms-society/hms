import { useQuery } from '@tanstack/react-query'

import type { CaseChecklistItem as PersistedChecklistItem } from '@hms/core/case-management/domain/entities'
import type { DocumentValidationDocument } from '@hms/core/document-engine/domain/entities'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { getChecklistDocumentStatusView } from '../checklist-document-status'
import type { ChecklistItem } from '../types'

export type UseCaseChecklistParams = {
  caseId: string
  fallbackChecklist?: ChecklistItem[]
}

export function useCaseChecklist({
  caseId,
  fallbackChecklist = [],
}: UseCaseChecklistParams) {
  const { caseManagementService, documentValidationService } = useRestContext()
  const {
    data: persistedChecklistItems = [],
    error: checklistError,
    isLoading: isLoadingChecklist,
  } = useQuery({
    queryKey: ['case-management', 'cases', caseId, 'checklist'],
    queryFn: async () => {
      const response = await caseManagementService.listCaseChecklist(caseId)

      if (response.isFailure) response.throwError()

      return response.body
    },
    enabled: Boolean(caseId),
  })
  const {
    data: documentValidationDocuments = [],
    error: documentsError,
    isLoading: isLoadingDocuments,
  } = useQuery({
    queryKey: ['document-validation', 'documents', { caseId }],
    queryFn: async () => {
      const response = await documentValidationService.listDocuments({ caseId })

      if (response.isFailure) response.throwError()

      return response.body
    },
    enabled: Boolean(caseId),
  })
  const checklistItems =
    persistedChecklistItems.length > 0
      ? persistedChecklistItems.map((item) =>
          mapPersistedChecklistItem(item, documentValidationDocuments),
        )
      : fallbackChecklist
  const requiredChecklistItems = checklistItems.filter(
    (item) => item.isRequired !== false,
  )
  const validatedItemsCount = requiredChecklistItems.filter(
    (item) => item.status === 'validado',
  ).length
  const mandatoryItemsCount = requiredChecklistItems.length
  const pendingItemsCount = mandatoryItemsCount - validatedItemsCount
  const completionPercentage =
    mandatoryItemsCount > 0
      ? Math.round((validatedItemsCount / mandatoryItemsCount) * 100)
      : 0

  return {
    checklistError: checklistError ?? documentsError,
    checklistItems,
    completionPercentage,
    isChecklistComplete: mandatoryItemsCount > 0 && pendingItemsCount === 0,
    isLoadingChecklist: isLoadingChecklist || isLoadingDocuments,
    mandatoryItemsCount,
    pendingItemsCount,
    persistedChecklistItems,
    validatedItemsCount,
  }
}

function mapPersistedChecklistItem(
  item: PersistedChecklistItem,
  documents: readonly DocumentValidationDocument[],
): ChecklistItem {
  const validatedBy = item.validatedBy ? ` por ${item.validatedBy}` : ''
  const validatedAt = item.validatedAt
    ? ` em ${formatChecklistGateDecisionDate(item.validatedAt)}`
    : ''
  const documentLabel = item.documentFileName ?? item.documentFileId
  const document = documents.find((currentDocument) => {
    return currentDocument.id === item.documentFileId
  })
  const documentStatusView = getChecklistDocumentStatusView({
    document,
    hasDocument: Boolean(documentLabel),
    isValidated: item.status === 'validated',
  })
  const validationSuffix = documentStatusView.isValidated
    ? `${validatedBy}${validatedAt}`
    : ''
  const documentName = documentLabel
    ? `${documentLabel} - ${documentStatusView.description}${validationSuffix}`
    : undefined

  return {
    id: item.id,
    documentFileId: item.documentFileId,
    documentName,
    isRequired: item.isRequired,
    status: documentStatusView.isValidated ? 'validado' : 'solicitado',
    statusLabel: documentLabel ? documentStatusView.label : undefined,
    subtitle: documentLabel
      ? documentStatusView.subtitle
      : 'Documento ainda não recebido',
    title: item.title,
  }
}

function formatChecklistGateDecisionDate(value: Date | string) {
  const date = new Date(value)
  const day = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
  }).format(date)
  const time = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  }).format(date)

  return `${day} ${time}`
}
