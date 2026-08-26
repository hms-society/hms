import type {
  ConsultationDocumentListItem,
  ConsultationDocumentVersionSummary,
} from '@hms/core/consultation/domain/structures'
import { DocumentGenerationStatus } from '@hms/core/document-production/domain/structures'
import { IntakeStatus } from '@hms/core/intake/domain/structures'
import { useMemo, useState } from 'react'
import { useConsultation } from '@/ui/consultation/hooks/use-consultation'
import { useConsultationDocumentsQuery } from '../../../hooks/use-consultation-documents-query'
import { useCancelConsultationDocumentGenerationAction } from '../../../hooks/use-cancel-consultation-document-generation-action'
import { useGenerateConsultationDocumentAction } from '../../../hooks/use-generate-consultation-document-action'
import { useGenerateConsultationDocumentsAction } from '../../../hooks/use-generate-consultation-documents-action'
import { useConsultationDocumentSelectionQuery } from '../../../hooks/use-consultation-document-selection-query'
import { useReplaceConsultationDocumentSelectionAction } from '../../../hooks/use-replace-consultation-document-selection-action'
import { useConfirmConsultationDocumentPackageAction } from '../../../hooks/use-confirm-consultation-document-package-action'
import { useReopenConsultationDocumentPackageAction } from '../../../hooks/use-reopen-consultation-document-package-action'
import { useUpdateDocumentAccessAction } from '../../../hooks/use-update-document-access-action'

export type ConsultationDocumentsPageProps = {
  consultationId: string
}

export type ConsultationDocumentStatus =
  | 'not_generated'
  | 'in_review'
  | 'rejected'
  | 'approved'
  | 'failed'
  | 'generating'

export type ConsultationDocumentViewModel = {
  document: ConsultationDocumentListItem & {
    classificacaoAcesso?:
      | 'INTERNO'
      | 'CLIENTE'
      | 'RESTRITO'
      | 'CONFIDENCIAL'
      | 'PARCEIRO_LIBERADO'
  }
  latestVersion?: ConsultationDocumentVersionSummary
  latestVersionRouteParams?: {
    consultationId: string
    documentId: string
    documentVersionId: string
  }
  status: ConsultationDocumentStatus
  statusLabel: string
  isCurrent: boolean
  isGenerating: boolean
  isTimedOut: boolean
}

function getVersionStatusViewModel(status: ConsultationDocumentVersionSummary['status']) {
  if (status === 'in_review') {
    return {
      statusLabel: 'Em revisão',
    }
  }

  if (status === 'rejected') {
    return {
      statusLabel: 'Rejeitado',
    }
  }

  return {
    statusLabel: 'Aprovado',
  }
}

function getLatestVersion(versions: readonly ConsultationDocumentVersionSummary[]) {
  return [...versions].sort((left, right) => right.versionNumber - left.versionNumber)[0]
}

function getDocumentStatus(
  latestVersion: ConsultationDocumentVersionSummary | undefined,
  generationStatus: ConsultationDocumentViewModel['document']['generationStatus'],
  isOptimisticallyGenerating: boolean,
  isGenerationStopped: boolean,
): Pick<ConsultationDocumentViewModel, 'status' | 'statusLabel'> {
  if (generationStatus === DocumentGenerationStatus.Failed) {
    return {
      status: 'failed',
      statusLabel: 'Falha na geração',
    }
  }

  const isGenerating =
    !isGenerationStopped &&
    (isOptimisticallyGenerating ||
      generationStatus === DocumentGenerationStatus.Pending ||
      generationStatus === DocumentGenerationStatus.Running)

  if (isGenerating) {
    return {
      status: 'generating',
      statusLabel: 'Gerando',
    }
  }

  if (!latestVersion) {
    return {
      status: 'not_generated',
      statusLabel: 'Não gerado',
    }
  }

  const status = getVersionStatusViewModel(latestVersion.status)

  return {
    status: latestVersion.status,
    statusLabel: status.statusLabel,
  }
}

export function useConsultationDocumentsPage({
  consultationId,
}: ConsultationDocumentsPageProps) {
  const { consultation } = useConsultation(consultationId)
  const isConsultationPending = consultation?.status === 'pending'
  const isAttendanceFinalized = Boolean(consultation?.attendanceFinalizedAt)
  const isIntakeClosedWithoutContract =
    consultation?.intake?.status === IntakeStatus.ClosedWithoutContract
  const isDocumentsBlockedByClosure = isIntakeClosedWithoutContract
  const isDocumentsAvailable = isAttendanceFinalized && !isDocumentsBlockedByClosure
  const documentsQuery = useConsultationDocumentsQuery(consultationId, {
    enabled: isDocumentsAvailable,
  })
  const selectionQuery = useConsultationDocumentSelectionQuery(consultationId, {
    enabled: isDocumentsAvailable,
  })
  const isPackageConfirmed = Boolean(selectionQuery.data?.confirmedAt)
  const isReadOnly =
    !isConsultationPending || isDocumentsBlockedByClosure || isPackageConfirmed
  const selectionAction = useReplaceConsultationDocumentSelectionAction(consultationId)
  const cancellationAction = useCancelConsultationDocumentGenerationAction(consultationId)
  const individualGeneration = useGenerateConsultationDocumentAction(consultationId)
  const batchGeneration = useGenerateConsultationDocumentsAction(consultationId)
  const packageConfirmationAction =
    useConfirmConsultationDocumentPackageAction(consultationId)
  const packageReopeningAction =
    useReopenConsultationDocumentPackageAction(consultationId)
  const updateAccessAction = useUpdateDocumentAccessAction()

  const [isSelectionOpen, setIsSelectionOpen] = useState(false)
  const [cancelledDocumentIds, setCancelledDocumentIds] = useState<ReadonlySet<string>>(
    new Set(),
  )

  const pendingDocumentIds = useMemo(
    () =>
      new Set([
        ...individualGeneration.pendingDocumentIds,
        ...batchGeneration.pendingDocumentIds,
      ]),
    [individualGeneration.pendingDocumentIds, batchGeneration.pendingDocumentIds],
  )
  const timedOutDocumentIds = useMemo(
    () =>
      new Set([
        ...individualGeneration.timedOutDocumentIds,
        ...batchGeneration.timedOutDocumentIds,
      ]),
    [individualGeneration.timedOutDocumentIds, batchGeneration.timedOutDocumentIds],
  )

  const documents = useMemo<readonly ConsultationDocumentViewModel[]>(
    () =>
      (documentsQuery.data ?? []).map((document) => {
        const latestVersion = getLatestVersion(document.versions)
        const isOptimisticallyGenerating =
          pendingDocumentIds.has(document.id) && !cancelledDocumentIds.has(document.id)
        const isGenerationStopped =
          cancelledDocumentIds.has(document.id) || timedOutDocumentIds.has(document.id)
        const status = getDocumentStatus(
          latestVersion,
          document.generationStatus,
          isOptimisticallyGenerating,
          isGenerationStopped,
        )

        return {
          document,
          latestVersion,
          latestVersionRouteParams: latestVersion
            ? {
                consultationId,
                documentId: document.id,
                documentVersionId: latestVersion.id,
              }
            : undefined,
          ...status,
          isCurrent: Boolean(
            latestVersion && latestVersion.id === document.currentVersionId,
          ),
          isGenerating: status.status === 'generating',
          isTimedOut:
            timedOutDocumentIds.has(document.id) &&
            status.status !== 'generating' &&
            document.generationStatus !== DocumentGenerationStatus.Failed &&
            document.generationStatus !== DocumentGenerationStatus.Cancelled &&
            !cancelledDocumentIds.has(document.id),
        }
      }),
    [
      documentsQuery.data,
      pendingDocumentIds,
      timedOutDocumentIds,
      cancelledDocumentIds,
      consultationId,
    ],
  )

  function handleGenerateDocument(documentId: string) {
    if (isReadOnly) return Promise.resolve()

    setCancelledDocumentIds((ids) => {
      if (!ids.has(documentId)) return ids
      const next = new Set(ids)
      next.delete(documentId)
      return next
    })
    return individualGeneration.generateDocument({ documentId })
  }

  function handleGenerateDocuments() {
    if (isReadOnly) return Promise.resolve()

    setCancelledDocumentIds(new Set())
    return batchGeneration.generateDocuments()
  }

  async function handleCancelDocumentGeneration(documentId: string) {
    if (isReadOnly) return

    await cancellationAction.cancelDocumentGeneration(documentId)
    setCancelledDocumentIds((ids) => new Set(ids).add(documentId))
  }

  function handleRetry() {
    return documentsQuery.refetch()
  }

  function handleRefresh() {
    return documentsQuery.refetch()
  }

  async function handleSaveSelection(documentSpecificationIds: readonly string[]) {
    if (isReadOnly) return

    await selectionAction.replaceSelection(documentSpecificationIds)
    setIsSelectionOpen(false)
  }

  async function handleConfirmPackage() {
    if (isReadOnly) return

    await packageConfirmationAction.confirmDocumentPackage()
  }

  async function handleReopenPackage() {
    if (!isPackageConfirmed || !isConsultationPending || isDocumentsBlockedByClosure) {
      return
    }

    await packageReopeningAction.reopenDocumentPackage()
  }

  async function handleUpdateAccess(
    documentId: string,
    classification: string,
    partnerId?: string,
  ) {
    if (isReadOnly) return

    await updateAccessAction.updateDocumentAccess({
      documentId,
      classificacaoAcesso: classification,
      partnerId,
    })
    handleRefresh()
  }

  return {
    consultation,
    documents,
    selection: selectionQuery.data,
    isReadOnly,
    isConsultationPending,
    isSelectionLoading: selectionQuery.isLoading,
    isSelectionOpen,
    setIsSelectionOpen,
    isSelectionSaving: selectionAction.isReplacing,
    selectionError: selectionQuery.error ?? selectionAction.error,
    isLoading: documentsQuery.isLoading,
    isAttendanceFinalized,
    isPackageConfirmed,
    isPackageConfirming: packageConfirmationAction.isConfirming,
    packageConfirmationError: packageConfirmationAction.error,
    isPackageReopening: packageReopeningAction.isReopening,
    packageReopeningError: packageReopeningAction.error,
    isError: documentsQuery.isError,
    isDocumentsBlockedByClosure,
    isBatchGenerating:
      batchGeneration.isGeneratingDocuments ||
      batchGeneration.pendingDocumentIds.length > 0,
    isCancellingDocument: cancellationAction.isCancellingDocument,
    error: documentsQuery.error,
    handleGenerateDocument,
    handleGenerateDocuments,
    handleCancelDocumentGeneration,
    handleRetry,
    handleRefresh,
    handleSaveSelection,
    handleConfirmPackage,
    handleReopenPackage,
    handleUpdateAccess,
  }
}

export type ConsultationDocumentsPageController = ReturnType<
  typeof useConsultationDocumentsPage
>
