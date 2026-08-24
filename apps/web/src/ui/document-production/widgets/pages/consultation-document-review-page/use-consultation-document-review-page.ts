import type {
  ConsultationDocumentListItem,
  ConsultationDocumentVersionReviewRequest,
} from '@hms/core/consultation/domain/structures'
import {
  DocumentGenerationStatus,
  DocumentVersionSource,
  DocumentVersionStatus,
} from '@hms/core/document-production/domain/structures'
import type {
  DocumentPendingMarker,
  DocumentTemplateContent,
} from '@hms/core/document-production/domain/structures'
import type { DocumentVersion } from '@hms/core/document-production/domain/entities'
import { HTTP_STATUS_CODE } from '@hms/core/shared/constants'
import { useEffect, useMemo, useState } from 'react'

import { useNavigation } from '@/ui/shared/hooks/use-navigation'
import { useConsultationDocumentVersionQuery } from '../../../hooks/use-consultation-document-version-query'
import { useConsultationDocumentsQuery } from '../../../hooks/use-consultation-documents-query'
import { useCancelConsultationDocumentGenerationAction } from '../../../hooks/use-cancel-consultation-document-generation-action'
import { useGenerateConsultationDocumentAction } from '../../../hooks/use-generate-consultation-document-action'
import { useReviewConsultationDocumentVersionAction } from '../../../hooks/use-review-consultation-document-version-action'
import { useSaveManualConsultationDocumentVersionAction } from '../../../hooks/use-save-manual-consultation-document-version-action'
import { useSelectCurrentConsultationDocumentVersionAction } from '../../../hooks/use-select-current-consultation-document-version-action'

export type ConsultationDocumentReviewPageProps = {
  consultationId: string
  documentId: string
  documentVersionId: string
}

export type ConsultationDocumentReviewStatus = 'in_review' | 'approved' | 'rejected'
export type ConsultationDocumentReviewGenerationState = 'idle' | 'generating' | 'failed'

type ErrorWithStatus = Error & { statusCode?: number }

export type ConsultationDocumentReviewViewModel = {
  title: string
  versionNumber: number
  sourceLabel: string
  status: ConsultationDocumentReviewStatus
  statusLabel: string
  isCurrent: boolean
  isApproved: boolean
  isInReview: boolean
  isRejected: boolean
  generationState: ConsultationDocumentReviewGenerationState
  isGenerating: boolean
  isGenerationFailed: boolean
  createdAtLabel: string
  rejectionReason?: string
}

export type ConsultationDocumentReviewHistoryItem = {
  id: string
  versionNumber: number
  sourceLabel: string
  status: ConsultationDocumentReviewStatus
  statusLabel: string
  createdAtLabel: string
  rejectionReason?: string
  isCurrent: boolean
}

function cloneContent(content: DocumentTemplateContent): DocumentTemplateContent {
  return JSON.parse(JSON.stringify(content)) as DocumentTemplateContent
}

function removeMarkerFromContent(
  content: DocumentTemplateContent,
  marker: string,
): DocumentTemplateContent {
  const nextContent = cloneContent(content)

  function removeMarker(value: unknown) {
    if (!value || typeof value !== 'object') return
    const node = value as { text?: string; content?: unknown[] }
    if (typeof node.text === 'string') node.text = node.text.replaceAll(marker, '')
    node.content?.forEach(removeMarker)
  }

  removeMarker(nextContent)
  return nextContent
}

function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(typeof value === 'string' ? new Date(value) : value)
}

function getSourceLabel(source: DocumentVersionSource) {
  return source === DocumentVersionSource.Manual ? 'Edição manual' : 'Geração por IA'
}

function getStatusLabel(status: ConsultationDocumentReviewStatus) {
  if (status === DocumentVersionStatus.InReview) return 'Em revisão'
  if (status === DocumentVersionStatus.Rejected) return 'Rejeitado'
  return 'Aprovado'
}

function getContentText(value: unknown): string {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.map(getContentText).join(' ')
  if (value && typeof value === 'object')
    return Object.values(value).map(getContentText).join(' ')
  return ''
}

function getErrorStatus(error: unknown) {
  return error instanceof Error ? (error as ErrorWithStatus).statusCode : undefined
}

function createReviewViewModel(
  document: ConsultationDocumentListItem,
  version: DocumentVersion,
  isOptimisticallyGenerating: boolean,
  isGenerationCancelled: boolean,
): ConsultationDocumentReviewViewModel {
  const isGenerating =
    !isGenerationCancelled &&
    (isOptimisticallyGenerating ||
      document.generationStatus === DocumentGenerationStatus.Pending ||
      document.generationStatus === DocumentGenerationStatus.Running)
  const isGenerationFailed =
    !isGenerating && document.generationStatus === DocumentGenerationStatus.Failed

  return {
    title: document.title,
    versionNumber: version.versionNumber,
    sourceLabel: getSourceLabel(version.source),
    status: version.status,
    statusLabel: getStatusLabel(version.status),
    isCurrent: document.currentVersionId === version.id,
    isApproved: version.status === DocumentVersionStatus.Approved,
    isInReview: version.status === DocumentVersionStatus.InReview,
    isRejected: version.status === DocumentVersionStatus.Rejected,
    generationState: isGenerating ? 'generating' : isGenerationFailed ? 'failed' : 'idle',
    isGenerating,
    isGenerationFailed,
    createdAtLabel: formatDate(version.createdAt),
    rejectionReason: version.rejectionReason,
  }
}

function createHistory(
  document: ConsultationDocumentListItem,
): readonly ConsultationDocumentReviewHistoryItem[] {
  return [...document.versions]
    .sort((left, right) => right.versionNumber - left.versionNumber)
    .map((version) => ({
      id: version.id,
      versionNumber: version.versionNumber,
      sourceLabel: getSourceLabel(version.source),
      status: version.status,
      statusLabel: getStatusLabel(version.status),
      createdAtLabel: formatDate(version.createdAt),
      rejectionReason: version.rejectionReason,
      isCurrent: document.currentVersionId === version.id,
    }))
}

export function useConsultationDocumentReviewPage({
  consultationId,
  documentId,
  documentVersionId,
}: ConsultationDocumentReviewPageProps) {
  const { navigateTo } = useNavigation()
  const documentsQuery = useConsultationDocumentsQuery(consultationId)
  const versionQuery = useConsultationDocumentVersionQuery(
    consultationId,
    documentId,
    documentVersionId,
  )
  const reviewAction = useReviewConsultationDocumentVersionAction()
  const saveAction = useSaveManualConsultationDocumentVersionAction()
  const currentAction = useSelectCurrentConsultationDocumentVersionAction()
  const regenerateAction = useGenerateConsultationDocumentAction(consultationId)
  const cancellationAction = useCancelConsultationDocumentGenerationAction(consultationId)
  const [draft, setDraft] = useState<DocumentTemplateContent | undefined>()
  const [savedContent, setSavedContent] = useState<DocumentTemplateContent | undefined>()
  const [isEditing, setIsEditing] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [isRejectOpen, setIsRejectOpen] = useState(false)
  const [isSaveOpen, setIsSaveOpen] = useState(false)
  const [isCancelOpen, setIsCancelOpen] = useState(false)
  const [isPendingMarkersOpen, setIsPendingMarkersOpen] = useState(false)
  const [isMarkerNotFoundOpen, setIsMarkerNotFoundOpen] = useState(false)
  const [isRegenerateOpen, setIsRegenerateOpen] = useState(false)
  const [hasCancelledGeneration, setHasCancelledGeneration] = useState(false)
  const [regenerationInstructions, setRegenerationInstructions] = useState('')
  const [isApproveOpen, setIsApproveOpen] = useState(false)
  const [isCurrentOpen, setIsCurrentOpen] = useState(false)
  const [isRejectionReasonOpen, setIsRejectionReasonOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [highlightedTerms, setHighlightedTerms] = useState<readonly string[]>([])
  const [removedPendingMarkers, setRemovedPendingMarkers] = useState<readonly string[]>(
    [],
  )
  const [actionError, setActionError] = useState<string | undefined>()
  const [pendingNavigation, setPendingNavigation] = useState<string | undefined>()

  const document = useMemo(
    () => documentsQuery.data?.find((item) => item.id === documentId),
    [documentId, documentsQuery.data],
  )
  const version = versionQuery.documentVersion

  useEffect(
    function synchronizeLoadedVersion() {
      if (!version) return
      const nextContent = cloneContent(version.content)
      setDraft(nextContent)
      setSavedContent(cloneContent(nextContent))
      setIsEditing(false)
      setHighlightedTerms([])
      setRemovedPendingMarkers([])
      setIsRejectionReasonOpen(false)
    },
    [version],
  )

  const isLoading = documentsQuery.isLoading || versionQuery.isLoadingDocumentVersion
  const hasNotFound =
    !isLoading &&
    Boolean(document && version) &&
    (version?.documentId !== documentId ||
      !document?.versions.some((item) => item.id === version.id))
  const isNotFoundError =
    getErrorStatus(documentsQuery.error) === HTTP_STATUS_CODE.notFound ||
    getErrorStatus(versionQuery.documentVersionError) === HTTP_STATUS_CODE.notFound
  const isForbidden =
    getErrorStatus(documentsQuery.error) === HTTP_STATUS_CODE.forbidden ||
    getErrorStatus(versionQuery.documentVersionError) === HTTP_STATUS_CODE.forbidden
  const isError = documentsQuery.isError || Boolean(versionQuery.documentVersionError)
  const isDirty = Boolean(
    isEditing &&
      draft &&
      savedContent &&
      JSON.stringify(draft) !== JSON.stringify(savedContent),
  )

  const viewModel = useMemo(
    () =>
      document && version
        ? createReviewViewModel(
            document,
            version,
            regenerateAction.isGeneratingDocument ||
              (regenerateAction.pendingDocumentIds.includes(documentId) &&
                !hasCancelledGeneration),
            hasCancelledGeneration,
          )
        : undefined,
    [
      document,
      documentId,
      regenerateAction.isGeneratingDocument,
      regenerateAction.pendingDocumentIds,
      hasCancelledGeneration,
      version,
    ],
  )
  const history = useMemo(() => (document ? createHistory(document) : []), [document])
  const versionPendingMarkers: readonly DocumentPendingMarker[] =
    version?.pendingMarkers ?? []
  const pendingMarkers = versionPendingMarkers.filter(
    (item) => !removedPendingMarkers.includes(item.marker),
  )

  function getReviewPath(nextVersionId: string) {
    return `/consultas/${consultationId}/documentos/${documentId}/versoes/${nextVersionId}`
  }

  async function navigateToVersion(nextVersionId: string) {
    await navigateTo('consultationDocumentVersion', {
      params: { consultationId, documentId, documentVersionId: nextVersionId },
    })
  }

  function handleVersionNavigation(nextVersionId: string) {
    if (nextVersionId === documentVersionId) {
      setIsHistoryOpen(false)
      return
    }
    if (isDirty) {
      setPendingNavigation(getReviewPath(nextVersionId))
      setIsCancelOpen(true)
      return
    }
    setIsHistoryOpen(false)
    void navigateToVersion(nextVersionId)
  }

  function handleContentChange(nextContent: DocumentTemplateContent) {
    setDraft(nextContent)
  }

  function handleStartEditing() {
    setActionError(undefined)
    setIsEditing(true)
  }

  function handleRequestCancel() {
    if (isDirty) setIsCancelOpen(true)
    else setIsEditing(false)
  }

  function handleConfirmCancel() {
    if (savedContent) setDraft(cloneContent(savedContent))
    setIsEditing(false)
    setRemovedPendingMarkers([])
    setIsCancelOpen(false)
    const nextPath = pendingNavigation
    setPendingNavigation(undefined)
    if (nextPath) {
      const nextVersionId = nextPath.split('/').at(-1)
      if (nextVersionId) void navigateToVersion(nextVersionId)
    }
  }

  function handleRequestSave() {
    if (isDirty) setIsSaveOpen(true)
  }

  async function handleConfirmSave() {
    if (!draft || !version) return
    setActionError(undefined)
    try {
      const result = await saveAction.saveManualVersion({
        consultationId,
        documentId,
        sourceDocumentVersionId: version.id,
        content: draft,
      })
      if (!result.body) {
        setIsPendingMarkersOpen(false)
        setActionError(
          'Não foi possível persistir a remoção da pendência. Tente novamente.',
        )
        return
      }
      setIsSaveOpen(false)
      setIsEditing(false)
      await navigateToVersion(result.body.id)
    } catch {
      setActionError('Não foi possível salvar a nova versão. O rascunho foi preservado.')
    }
  }

  async function handleReview(request: ConsultationDocumentVersionReviewRequest) {
    setActionError(undefined)
    try {
      const result = await reviewAction.reviewVersion({
        consultationId,
        documentId,
        documentVersionId,
        request,
      })
      setIsRejectOpen(false)
      setIsApproveOpen(false)
      setRejectionReason('')
      if (result.isConflict) {
        await Promise.all([documentsQuery.refetch(), versionQuery.refetch()])
        setActionError('Conflito: a decisão já foi alterada. Os dados foram atualizados.')
      }
    } catch {
      setActionError('Não foi possível concluir a decisão. Tente novamente.')
    }
  }

  function handleApprove() {
    setIsApproveOpen(true)
  }

  function handleReject() {
    setRejectionReason('')
    setIsRejectOpen(true)
  }

  function handleViewRejectionReason() {
    if (!viewModel?.rejectionReason) return
    setIsRejectionReasonOpen(true)
  }

  async function handleConfirmReject() {
    const reason = rejectionReason.trim()
    if (!reason) return
    await handleReview({
      decision: DocumentVersionStatus.Rejected,
      rejectionReason: reason,
    })
  }

  async function handleConfirmApprove() {
    await handleReview({ decision: DocumentVersionStatus.Approved })
  }

  async function handleConfirmCurrent() {
    setActionError(undefined)
    try {
      const result = await currentAction.selectCurrentVersion({
        consultationId,
        documentId,
        documentVersionId,
      })
      setIsCurrentOpen(false)
      if (result.isConflict) {
        await Promise.all([documentsQuery.refetch(), versionQuery.refetch()])
        setActionError(
          'Conflito: a vigência já foi alterada. Os dados foram atualizados.',
        )
      }
    } catch {
      setActionError('Não foi possível tornar esta versão vigente. Tente novamente.')
    }
  }

  function handleRequestRegenerate() {
    setHasCancelledGeneration(false)
    setRegenerationInstructions('')
    setIsRegenerateOpen(true)
  }

  async function handleConfirmRegenerate(instructions: string) {
    setActionError(undefined)
    try {
      await regenerateAction.generateDocument({ documentId, instructions })
      setIsRegenerateOpen(false)
    } catch {
      setActionError('Não foi possível solicitar uma nova versão. Tente novamente.')
    }
  }

  async function handleCancelGeneration() {
    setActionError(undefined)
    try {
      await cancellationAction.cancelDocumentGeneration(documentId)
      setHasCancelledGeneration(true)
      await documentsQuery.refetch()
    } catch {
      setActionError('Não foi possível cancelar a geração. Tente novamente.')
    }
  }

  function handleLocateMarker(marker: string) {
    if (!version || !draft) return
    const present = getContentText(draft).includes(marker)
    setIsPendingMarkersOpen(false)
    if (!present) {
      setIsMarkerNotFoundOpen(true)
      return
    }
    setHighlightedTerms([marker])
  }

  async function persistPendingMarkerRemoval(
    nextDraft: DocumentTemplateContent,
    removedMarkers: readonly string[],
  ) {
    if (!version || saveAction.isSavingManualVersion) return
    setActionError(undefined)
    try {
      const result = await saveAction.saveManualVersion({
        consultationId,
        documentId,
        sourceDocumentVersionId: version.id,
        content: nextDraft,
      })
      if (!result.body) return
      setDraft(nextDraft)
      setIsEditing(false)
      setIsPendingMarkersOpen(false)
      setRemovedPendingMarkers((current) => [...new Set([...current, ...removedMarkers])])
      setHighlightedTerms([])
      await navigateToVersion(result.body.id)
    } catch {
      setIsPendingMarkersOpen(false)
      setActionError(
        'Não foi possível persistir a remoção da pendência. Tente novamente.',
      )
    }
  }

  function handleRemovePendingMarker(marker: string) {
    if (!draft || saveAction.isSavingManualVersion) return
    void persistPendingMarkerRemoval(removeMarkerFromContent(draft, marker), [marker])
  }

  function handleRemoveAllPendingMarkers() {
    if (!draft || saveAction.isSavingManualVersion) return
    const nextDraft = versionPendingMarkers.reduce(
      (content, item) => removeMarkerFromContent(content, item.marker),
      draft,
    )
    void persistPendingMarkerRemoval(
      nextDraft,
      versionPendingMarkers.map((item) => item.marker),
    )
  }

  async function handleRetry() {
    await Promise.all([documentsQuery.refetch(), versionQuery.refetch()])
  }

  async function handleBack() {
    await navigateTo('consultationDocuments', { params: { consultationId } })
  }

  return {
    actionError,
    currentAction,
    draft,
    handleApprove,
    handleBack,
    handleConfirmApprove,
    handleConfirmCancel,
    handleConfirmCurrent,
    handleConfirmRegenerate,
    handleConfirmReject,
    handleConfirmSave,
    handleContentChange,
    handleLocateMarker,
    handleRemoveAllPendingMarkers,
    handleRemovePendingMarker,
    handleReject,
    handleRequestCancel,
    handleRequestSave,
    handleRetry,
    handleStartEditing,
    handleVersionNavigation,
    handleViewRejectionReason,
    highlightedTerms,
    isApproveOpen,
    isCancelOpen,
    isCurrentOpen,
    isDirty,
    isEditing,
    isError,
    isForbidden,
    isHistoryOpen,
    isLoading,
    isMarkerNotFoundOpen,
    isNotFound: hasNotFound || isNotFoundError,
    isPendingMarkersOpen,
    isRemovingPendingMarker: saveAction.isSavingManualVersion,
    isRegenerateOpen,
    regenerationInstructions,
    isRejectionReasonOpen,
    isRejectOpen,
    isSaveOpen,
    isSaving: saveAction.isSavingManualVersion,
    isSubmittingDecision: reviewAction.isReviewingVersion,
    isSelectingCurrent: currentAction.isSelectingCurrentVersion,
    isRegenerating: regenerateAction.isGeneratingDocument,
    isCancellingGeneration: cancellationAction.isCancellingDocument,
    handleCancelGeneration,
    history,
    pendingMarkers,
    rejectionReason,
    setIsApproveOpen,
    setIsCancelOpen,
    setIsCurrentOpen,
    setIsHistoryOpen,
    setIsMarkerNotFoundOpen,
    setIsPendingMarkersOpen,
    setIsRegenerateOpen,
    setRegenerationInstructions,
    handleRequestRegenerate,
    setIsRejectionReasonOpen,
    setIsRejectOpen,
    setIsSaveOpen,
    setRejectionReason,
    title: document?.title,
    version,
    viewModel,
  }
}
