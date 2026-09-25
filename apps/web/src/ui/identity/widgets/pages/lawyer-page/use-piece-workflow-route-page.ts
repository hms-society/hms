import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'

import type { DocumentTemplateContent } from '@hms/core/document-production/domain/structures'
import type { CaseDocumentResponse } from '@/rest/services/case-document-production-service'
import { RestResponse } from '@hms/core/shared/responses/rest-response'
import type {
  DocumentEditorActions,
  PendingMarkerReplacement,
} from '@/ui/document-production/widgets/components/document-editor'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'
import { useCurrentCollaboratorQuery } from '@/ui/identity/hooks/use-current-collaborator-query'

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
  const [editorActions, setEditorActions] = useState<DocumentEditorActions | null>(null)
  const [isPendingVariableDialogOpen, setIsPendingVariableDialogOpen] = useState(false)
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'error'>('saved')
  const lastSavedContent = useRef<string | null>(null)
  const saveSequence = useRef(0)
  const saveQueue = useRef<Promise<void>>(Promise.resolve())
  const saveTimeout = useRef<number | null>(null)
  const isMounted = useRef(true)
  const pendingSave = useRef<{
    content: DocumentTemplateContent
    versionId: string
  } | null>(null)
  const persistEditedContentRef = useRef(persistEditedContent)
  const documentQueryKey = ['case-document', caseId, documentId] as const
  const {
    data: documentResponse,
    error: documentError,
    isError: isDocumentError,
    isLoading: isLoadingDocument,
  } = useQuery({
    queryKey: ['case-document', caseId, documentId],
    queryFn: () => caseDocumentProductionService.getDocument(caseId, documentId),
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
  const version =
    document?.versions.find((item) => item.id === document.currentVersionId) ??
    document?.versions.at(-1)
  const currentContent = editedContent ?? version?.content
  const serializedContent = currentContent ? JSON.stringify(currentContent) : ''
  const pendingVariables =
    version?.pendingVariables.filter((variable) =>
      serializedContent.includes(variable.marker),
    ) ?? []
  const isAuthor = Boolean(
    version && currentCollaborator?.collaboratorId === version.createdByCollaboratorId,
  )

  useEffect(() => {
    if (!editedContent || !version || mode !== 'editor') return
    pendingSave.current = { content: editedContent, versionId: version.id }
  }, [editedContent, mode, version])

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
      const unsavedContent = pendingSave.current
      if (
        !unsavedContent ||
        JSON.stringify(unsavedContent.content) === lastSavedContent.current
      )
        return
      if (saveTimeout.current !== null) window.clearTimeout(saveTimeout.current)
      saveTimeout.current = null
      void persistEditedContentRef.current(
        unsavedContent.content,
        unsavedContent.versionId,
        ++saveSequence.current,
      )
    }
  }, [])

  persistEditedContentRef.current = persistEditedContent

  useEffect(() => {
    if (!editedContent || !version || mode !== 'editor') return
    const serialized = JSON.stringify(editedContent)
    if (serialized === lastSavedContent.current) return

    const sequence = ++saveSequence.current
    setSaveState('saving')
    const timeout = window.setTimeout(() => {
      saveTimeout.current = null
      void persistEditedContentRef.current(editedContent, version.id, sequence)
    }, 700)
    saveTimeout.current = timeout

    return () => {
      window.clearTimeout(timeout)
      if (saveTimeout.current === timeout) saveTimeout.current = null
    }
  }, [editedContent, mode, version])

  async function handleBackToCase() {
    if (mode === 'editor' && editedContent && version) {
      if (saveTimeout.current !== null) {
        window.clearTimeout(saveTimeout.current)
        saveTimeout.current = null
      }

      const sequence = ++saveSequence.current
      setSaveState('saving')
      const didSave = await persistEditedContent(editedContent, version.id, sequence)
      if (!didSave) return
    }

    await navigateTo('lawyerCaseDetails', { params: { caseId } })
  }

  function handleOpenReview() {
    void navigateTo('lawyerCasePieceReview', {
      params: { caseId, documentId },
    })
  }

  function handleCloseReviewAction() {
    setReviewAction(null)
  }

  function handleConfirmReviewAction() {
    if (isAuthor) return
    if (reviewAction === 'adjustments') {
      void navigateTo('lawyerCasePieceEditor', {
        params: { caseId, documentId },
        search: { reviewState: 'adjustments_requested' },
      })
    }
    setReviewAction(null)
  }

  function handleOpenReviewAction(action: 'adjustments' | 'block' | 'approval') {
    if (isAuthor) return
    setReviewAction(action)
  }

  function handleReviewConfirmationChange(confirmed: boolean) {
    setIsReviewConfirmed(confirmed)
  }

  function handleChangeContent(content: DocumentTemplateContent) {
    setEditedContent(content)
  }

  async function persistEditedContent(
    content: DocumentTemplateContent,
    versionId: string,
    sequence: number,
  ) {
    const serialized = JSON.stringify(content)
    const saveOperation = saveQueue.current
      .catch(() => undefined)
      .then(async () => {
        if (serialized === lastSavedContent.current) return true

        try {
          const response = await caseDocumentProductionService.saveEditedContent(
            caseId,
            documentId,
            versionId,
            content,
          )
          if (response.isFailure) {
            if (isMounted.current && sequence === saveSequence.current)
              setSaveState('error')
            return false
          }

          lastSavedContent.current = serialized
          if (
            pendingSave.current &&
            JSON.stringify(pendingSave.current.content) === serialized
          )
            pendingSave.current = null
          const cachedResponse =
            queryClient.getQueryData<RestResponse<CaseDocumentResponse>>(documentQueryKey)
          if (cachedResponse && !cachedResponse.isFailure) {
            const cachedDocument = cachedResponse.body
            const updatedDocument: CaseDocumentResponse = {
              ...cachedDocument,
              versions: cachedDocument.versions.map((item) =>
                item.id === versionId ? { ...item, content } : item,
              ),
            }
            queryClient.setQueryData(
              documentQueryKey,
              new RestResponse({
                body: updatedDocument,
                statusCode: cachedResponse.statusCode,
                headers: cachedResponse.headers,
              }),
            )
          }
          if (isMounted.current && sequence === saveSequence.current)
            setSaveState('saved')
          return true
        } catch {
          if (isMounted.current && sequence === saveSequence.current)
            setSaveState('error')
          return false
        }
      })
    saveQueue.current = saveOperation.then(
      () => undefined,
      () => undefined,
    )
    return saveOperation
  }

  const handleEditorReady = useCallback((actions: DocumentEditorActions) => {
    setEditorActions(actions)
  }, [])

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

  return {
    document,
    documentError,
    documentId,
    editedContent,
    editorActions,
    isDocumentError,
    isLoadingDocument,
    isPendingVariableDialogOpen,
    isAuthor,
    isCheckingReviewer: isLoadingCurrentCollaborator,
    saveState,
    isReviewConfirmed,
    mode,
    pendingVariables,
    reviewAction,
    version,
    caseId,
    casePublicCode: caseDetails?.publicCode,
    handleBackToCase,
    handleChangeContent,
    handleEditorReady,
    handleOpenPendingVariableDialog,
    handlePendingVariableDialogOpenChange,
    handleApplyPendingVariableValues,
    handleCloseReviewAction,
    handleConfirmReviewAction,
    handleOpenReview,
    handleOpenReviewAction,
    handleReviewConfirmationChange,
  }
}
