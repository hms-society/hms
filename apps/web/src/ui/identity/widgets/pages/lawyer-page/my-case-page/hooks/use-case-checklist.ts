import type { CaseChecklistItem as PersistedChecklistItem } from '@hms/core/case-management/domain/entities'
import type { DocumentValidationDocument } from '@hms/core/document-engine/domain/entities'

import { usePersistedChecklistQuery } from '@/ui/case-management/hooks/use-persisted-checklist-query'
import { useCaseDocumentValidationQuery } from '@/ui/document-engine/hooks/use-case-document-validation-query'
import { useCurrentCollaboratorQuery } from '@/ui/identity/hooks/use-current-collaborator-query'
import { getChecklistDocumentStatusView } from '../checklist-document-status'
import type { ChecklistItem } from '../types'

export type UseCaseChecklistParams = {
  caseId: string
  fallbackChecklist?: ChecklistItem[]
  enabled?: boolean
}

export function useCaseChecklist({
  caseId,
  fallbackChecklist = [],
  enabled = true,
}: UseCaseChecklistParams) {
  const { currentCollaborator } = useCurrentCollaboratorQuery()
  const {
    persistedChecklistItems,
    persistedChecklistError,
    isLoadingPersistedChecklist,
  } = usePersistedChecklistQuery(caseId, currentCollaborator?.collaboratorId, enabled)
  const {
    documentValidationDocuments,
    documentValidationError,
    isLoadingDocumentValidationDocuments,
  } = useCaseDocumentValidationQuery(caseId, currentCollaborator?.collaboratorId, enabled)
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
    checklistError: persistedChecklistError ?? documentValidationError,
    checklistItems,
    completionPercentage,
    isChecklistComplete: mandatoryItemsCount > 0 && pendingItemsCount === 0,
    isLoadingChecklist:
      isLoadingPersistedChecklist || isLoadingDocumentValidationDocuments,
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
  const document = documents.find((currentDocument) => {
    return (
      currentDocument.id === item.documentFileId ||
      currentDocument.checklistLink?.checklistItemId === item.id
    )
  })
  const documentLabel = item.documentFileName ?? item.documentFileId ?? document?.fileName
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
    documentFileId: item.documentFileId ?? document?.id,
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
