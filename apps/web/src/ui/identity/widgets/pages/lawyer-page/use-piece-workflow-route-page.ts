import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useState } from 'react'

import type { DocumentTemplateContent } from '@hms/core/document-production/domain/structures'
import { useCurrentCollaboratorQuery } from '@/ui/identity/hooks/use-current-collaborator-query'
import type {
  DocumentEditorActions,
  PendingMarkerReplacement,
} from '@/ui/document-production/widgets/components/document-editor'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export type PieceWorkflowRoutePageMode = 'editor' | 'review'
export type UsePieceWorkflowRoutePageProps = {
  mode: PieceWorkflowRoutePageMode
  caseId: string
  documentId: string
}

export function usePieceWorkflowRoutePage({
  mode,
  caseId,
  documentId,
}: UsePieceWorkflowRoutePageProps) {
  const { caseDocumentProductionService, caseManagementService } = useRestContext()
  const queryClient = useQueryClient()
  const { navigateTo } = useNavigation()
  const { currentCollaborator, isLoadingCurrentCollaborator } =
    useCurrentCollaboratorQuery()
  const [reviewAction, setReviewAction] = useState<
    'adjustments' | 'block' | 'approval' | null
  >(null)
  const [isReviewConfirmed, setIsReviewConfirmed] = useState(false)
  const [editedContent, setEditedContent] = useState<DocumentTemplateContent | null>(null)
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null)
  const [versionIdToSelectAfterDiscard, setVersionIdToSelectAfterDiscard] = useState<
    string | null
  >(null)
  const [isDiscardEditsDialogOpen, setIsDiscardEditsDialogOpen] = useState(false)
  const [editingSourceVersionId, setEditingSourceVersionId] = useState<string | null>(
    null,
  )
  const [editorActions, setEditorActions] = useState<DocumentEditorActions | null>(null)
  const [isPendingVariableDialogOpen, setIsPendingVariableDialogOpen] = useState(false)
  const [isVersionDialogOpen, setIsVersionDialogOpen] = useState(false)
  const [isGeneratingRevision, setIsGeneratingRevision] = useState(false)
  const [isStartingManualVersion, setIsStartingManualVersion] = useState(false)
  const [pendingGenerationVersion, setPendingGenerationVersion] = useState<{
    id: string
    versionNumber: number
    createdAt: string
  } | null>(null)
  const [versionActionError, setVersionActionError] = useState<string | undefined>()
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'error'>('saved')
  const {
    data: documentResponse,
    error: documentError,
    isError: isDocumentError,
    isLoading: isLoadingDocument,
    refetch: refetchDocument,
  } = useQuery({
    queryKey: ['case-document', caseId, documentId],
    queryFn: () => caseDocumentProductionService.getDocument(caseId, documentId),
    refetchInterval: (query) => {
      const versions = query.state.data?.body?.versions ?? []
      const generationStatus = query.state.data?.body?.generation?.status
      return generationStatus === 'pending' ||
        generationStatus === 'running' ||
        versions.some((item) => item.status === 'generating')
        ? 3000
        : false
    },
  })
  const { data: caseDetails } = useQuery({
    queryKey: ['case-details', caseId],
    queryFn: async () => {
      const response = await caseManagementService.getLegalCaseDetails(caseId)
      if (response.isFailure) response.throwError()
      return response.body
    },
  })
  const document = documentResponse?.body
  useEffect(() => {
    if (!pendingGenerationVersion || !document) return
    const generationFinished =
      document.generation?.status === 'completed' ||
      document.generation?.status === 'failed' ||
      document.generation?.status === 'cancelled' ||
      document.versions.some(
        (item) => item.versionNumber >= pendingGenerationVersion.versionNumber,
      )
    if (generationFinished) setPendingGenerationVersion(null)
  }, [document, pendingGenerationVersion])
  const currentVersion = document?.versions.reduce<
    (typeof document.versions)[number] | undefined
  >(
    (latest, candidate) =>
      !latest || candidate.versionNumber > latest.versionNumber ? candidate : latest,
    undefined,
  )
  const version =
    document?.versions.find((item) => item.id === selectedVersionId) ?? currentVersion
  const documentCreatorId = document?.versions.reduce<
    (typeof document.versions)[number] | undefined
  >(
    (oldest, candidate) =>
      !oldest || candidate.versionNumber < oldest.versionNumber ? candidate : oldest,
    undefined,
  )?.createdByCollaboratorId
  const isReadOnlyVersion = Boolean(
    mode === 'editor' && version && currentVersion && version.id !== currentVersion.id,
  )
  const editingSourceVersion = document?.versions.find(
    (item) => item.id === editingSourceVersionId,
  )
  const currentContent = editedContent ?? version?.content
  const serializedContent = currentContent ? JSON.stringify(currentContent) : ''
  const pendingVariables =
    version?.pendingVariables?.filter((variable) =>
      serializedContent.includes(variable.marker),
    ) ?? []
  const isAuthor = Boolean(
    version &&
      currentCollaborator &&
      (currentCollaborator.collaboratorId === version.createdByCollaboratorId ||
        currentCollaborator.collaboratorId === documentCreatorId),
  )
  const isReviewPending = Boolean(isAuthor && version?.status === 'rejected')
  const reviewRequest =
    version?.status === 'rejected' ? version.rejectionReason?.trim() : undefined
  const isPrivilegedReviewer =
    currentCollaborator?.profile === 'admin' ||
    currentCollaborator?.profile === 'supervisor'
  const isCaseTeamMember = Boolean(
    currentCollaborator &&
      caseDetails?.team.some(
        (member) => member.collaboratorId === currentCollaborator.collaboratorId,
      ),
  )
  const isReviewerEligible = Boolean(
    currentCollaborator && !isAuthor && (isPrivilegedReviewer || isCaseTeamMember),
  )

  function serializeComparableContent(content: DocumentTemplateContent) {
    function normalize(value: unknown): unknown {
      if (Array.isArray(value)) return value.map(normalize)
      if (typeof value !== 'object' || value === null) return value

      const normalizedEntries = Object.entries(value as Record<string, unknown>)
        .sort(([firstKey], [secondKey]) => firstKey.localeCompare(secondKey))
        .flatMap(([key, entryValue]) => {
          if (key === 'attrs' && typeof entryValue === 'object' && entryValue !== null) {
            const attributes = Object.fromEntries(
              Object.entries(entryValue as Record<string, unknown>).filter(
                ([attribute, attributeValue]) =>
                  attributeValue !== null &&
                  attributeValue !== undefined &&
                  !(attribute === 'start' && attributeValue === 1),
              ),
            )
            return Object.keys(attributes).length ? [[key, normalize(attributes)]] : []
          }
          return [[key, normalize(entryValue)]]
        })

      return Object.fromEntries(normalizedEntries)
    }

    return JSON.stringify(normalize(content))
  }

  async function saveManualVersion(
    content: DocumentTemplateContent,
    sourceVersionId: string,
  ) {
    setSaveState('saving')
    const response = await caseDocumentProductionService.saveManualVersion(
      caseId,
      documentId,
      sourceVersionId,
      content,
    )
    if (response.isFailure) {
      setSaveState('error')
      return null
    }
    const savedVersionId = response.body.id
    setEditedContent(null)
    setEditingSourceVersionId(null)
    setSelectedVersionId(savedVersionId)
    setSaveState('saved')
    await queryClient.invalidateQueries({
      queryKey: ['case-document', caseId, documentId],
    })
    await refetchDocument()
    return savedVersionId
  }

  async function handleBackToCase() {
    if (mode === 'editor' && editedContent && editingSourceVersionId) {
      const response = await caseDocumentProductionService.saveEditableVersion(
        caseId,
        documentId,
        editingSourceVersionId,
        editedContent,
      )
      if (response.isFailure) {
        setSaveState('error')
        return
      }
      setEditedContent(null)
      setEditingSourceVersionId(null)
      setSaveState('saved')
      await queryClient.invalidateQueries({
        queryKey: ['case-document', caseId, documentId],
      })
      await refetchDocument()
    }
    await navigateTo('lawyerCaseDetails', {
      params: { caseId },
      search: { tab: 'pecas' },
    })
  }

  async function handleOpenReview() {
    if (editedContent && editingSourceVersionId) {
      setVersionActionError(
        'Salve explicitamente a nova versão antes de abrir a revisão técnica.',
      )
      return
    }
    if (version?.status === 'draft') {
      const response = await caseDocumentProductionService.submitVersionForReview(
        caseId,
        documentId,
        version.id,
      )
      if (response.isFailure) {
        setVersionActionError('Não foi possível enviar o documento para revisão.')
        return
      }
      await queryClient.invalidateQueries({
        queryKey: ['case-document', caseId, documentId],
      })
      await refetchDocument()
    }
    void navigateTo('lawyerCasePieceReview', { params: { caseId, documentId } })
  }
  function handleCloseReviewAction() {
    setReviewAction(null)
  }
  async function handleConfirmReviewAction(adjustmentComment?: string) {
    if (!isReviewerEligible) return
    if (!reviewAction || !version) return
    const decision = reviewAction === 'approval' ? 'approved' : 'rejected'
    const response = await caseDocumentProductionService.reviewVersion(
      caseId,
      documentId,
      version.id,
      decision,
      reviewAction === 'adjustments'
        ? adjustmentComment || 'Ajustes solicitados pelo revisor.'
        : reviewAction === 'block'
          ? 'Peça bloqueada pelo revisor.'
          : undefined,
    )
    if (response.isFailure) {
      setVersionActionError(response.errorMessage)
      return
    }
    if (reviewAction === 'adjustments')
      void navigateTo('lawyerCasePieceEditor', {
        params: { caseId, documentId },
        search: { reviewState: 'adjustments_requested' },
      })
    setReviewAction(null)
    await queryClient.invalidateQueries({
      queryKey: ['case-document', caseId, documentId],
    })
    await refetchDocument()
  }
  function handleOpenReviewAction(action: 'adjustments' | 'block' | 'approval') {
    if (isReviewerEligible) setReviewAction(action)
  }
  function handleReviewConfirmationChange(confirmed: boolean) {
    setIsReviewConfirmed(confirmed)
  }
  function handleChangeContent(content: DocumentTemplateContent) {
    const baseContent = editingSourceVersion?.content ?? version?.content
    if (
      baseContent &&
      serializeComparableContent(content) === serializeComparableContent(baseContent)
    ) {
      setEditedContent(null)
      setEditingSourceVersionId(null)
      setSaveState('saved')
      return
    }
    if (!editingSourceVersionId && version) setEditingSourceVersionId(version.id)
    setEditedContent(content)
    setSaveState('saved')
  }
  function handleSelectVersion(versionId: string) {
    if (versionId === version?.id) return
    if (editedContent && editingSourceVersionId) {
      setVersionIdToSelectAfterDiscard(versionId)
      setIsDiscardEditsDialogOpen(true)
      return
    }
    setSelectedVersionId(versionId)
    setEditedContent(null)
    setEditingSourceVersionId(null)
    setSaveState('saved')
  }
  function handleCancelDiscardEdits() {
    setIsDiscardEditsDialogOpen(false)
    setVersionIdToSelectAfterDiscard(null)
  }
  function handleConfirmDiscardEdits() {
    if (versionIdToSelectAfterDiscard) {
      setSelectedVersionId(versionIdToSelectAfterDiscard)
      setEditedContent(null)
      setEditingSourceVersionId(null)
      setSaveState('saved')
    }
    handleCancelDiscardEdits()
  }
  const handleEditorReady = useCallback(
    (actions: DocumentEditorActions) => setEditorActions(() => actions),
    [],
  )
  function handleOpenPendingVariableDialog() {
    setIsPendingVariableDialogOpen(true)
  }
  function handlePendingVariableDialogOpenChange(open: boolean) {
    setIsPendingVariableDialogOpen(open)
  }
  function handleApplyPendingVariableValues(
    replacements: readonly PendingMarkerReplacement[],
  ) {
    editorActions?.replacePendingMarkers(replacements)
    setIsPendingVariableDialogOpen(false)
  }
  async function handleOpenVersionDialog() {
    setVersionActionError(undefined)
    if (editedContent && editingSourceVersionId) {
      setVersionActionError(
        'Salve explicitamente a nova versão antes de abrir o histórico.',
      )
      return
    }
    setIsVersionDialogOpen(true)
  }
  async function handleStartManualVersion(sourceVersionId: string) {
    if (editedContent) {
      setVersionActionError(
        'Salve as alterações atuais como nova versão antes de iniciar outra edição.',
      )
      return
    }
    const sourceVersion = document?.versions.find((item) => item.id === sourceVersionId)
    if (sourceVersionId !== currentVersion?.id) {
      setVersionActionError('Somente a versão atual pode ser aberta para edição manual.')
      return
    }
    if (!sourceVersion?.content) {
      setVersionActionError(
        'Esta versão não possui conteúdo estruturado para edição manual.',
      )
      return
    }
    setIsStartingManualVersion(true)
    setVersionActionError(undefined)
    const response = await caseDocumentProductionService.saveManualVersion(
      caseId,
      documentId,
      sourceVersionId,
      sourceVersion.content,
    )
    if (response.isFailure) {
      setIsStartingManualVersion(false)
      setVersionActionError('Não foi possível criar a nova versão manual.')
      return
    }
    const newVersionId = response.body.id
    await queryClient.invalidateQueries({
      queryKey: ['case-document', caseId, documentId],
    })
    await refetchDocument()
    setEditingSourceVersionId(newVersionId)
    setSelectedVersionId(newVersionId)
    setSaveState('saved')
    setIsStartingManualVersion(false)
    setIsVersionDialogOpen(false)
  }
  async function handleGenerateRevision(sourceVersionId: string, instructions: string) {
    const revisionSourceVersionId = sourceVersionId
    if (editedContent && editingSourceVersionId) {
      setVersionActionError(
        'Salve explicitamente a nova versão antes de solicitar uma geração por IA.',
      )
      return
    }
    setIsGeneratingRevision(true)
    setVersionActionError(undefined)
    try {
      const response = await caseDocumentProductionService.generateRevision(
        caseId,
        documentId,
        revisionSourceVersionId,
        instructions,
      )
      if (response.isFailure) {
        setVersionActionError(response.errorMessage)
        return
      }
      const nextVersionNumber =
        Math.max(...(document?.versions.map((item) => item.versionNumber) ?? [0])) + 1
      setPendingGenerationVersion({
        id: response.body.documentGenerationId,
        versionNumber: nextVersionNumber,
        createdAt: new Date().toISOString(),
      })
      setIsVersionDialogOpen(false)
      setSelectedVersionId(null)
      await queryClient.invalidateQueries({
        queryKey: ['case-document', caseId, documentId],
      })
      await refetchDocument()
    } catch (error) {
      setVersionActionError(
        error instanceof Error ? error.message : 'Não foi possível iniciar a geração.',
      )
    } finally {
      setIsGeneratingRevision(false)
    }
  }
  async function handleSaveNewVersion() {
    if (!editedContent || !editingSourceVersionId) return
    await saveManualVersion(editedContent, editingSourceVersionId)
  }

  const reviewEligibility: { isReviewerEligible?: boolean } = { isReviewerEligible }

  return {
    document,
    documentError,
    documentId,
    editedContent,
    editorActions,
    isDocumentError,
    isLoadingDocument,
    isReadOnlyVersion,
    isDiscardEditsDialogOpen,
    isPendingVariableDialogOpen,
    isVersionDialogOpen,
    isStartingManualVersion,
    isGeneratingRevision,
    pendingGenerationVersion,
    versionActionError,
    isAuthor,
    isReviewPending,
    reviewRequest,
    ...reviewEligibility,
    isCheckingReviewer: isLoadingCurrentCollaborator,
    saveState,
    isReviewConfirmed,
    mode,
    pendingVariables,
    reviewAction,
    currentVersion,
    version,
    caseId,
    casePublicCode: caseDetails?.publicCode,
    handleBackToCase,
    handleChangeContent,
    handleSelectVersion,
    handleCancelDiscardEdits,
    handleConfirmDiscardEdits,
    handleEditorReady,
    handleOpenPendingVariableDialog,
    handlePendingVariableDialogOpenChange,
    handleApplyPendingVariableValues,
    handleCloseReviewAction,
    handleConfirmReviewAction,
    handleOpenReview,
    handleOpenReviewAction,
    handleReviewConfirmationChange,
    handleOpenVersionDialog,
    handleVersionDialogOpenChange: setIsVersionDialogOpen,
    handleStartManualVersion,
    handleGenerateRevision,
    handleSaveNewVersion,
  }
}
