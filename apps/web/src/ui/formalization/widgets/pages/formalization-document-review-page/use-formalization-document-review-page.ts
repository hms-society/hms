import type { DocumentVersion } from '@hms/core/document-production/domain/entities'
import {
  DocumentVersionSource,
  DocumentVersionStatus,
} from '@hms/core/document-production/domain/structures'
import type { DocumentTemplateContent } from '@hms/core/document-production/domain/structures'
import type { ReviewFormalizationDocumentVersionRequest } from '@hms/core/formalization/interfaces'
import { useEffect, useMemo, useState } from 'react'

import { useFormalizationDocumentsQuery } from '@/ui/formalization/hooks/use-formalization-document-production-action'
import { useFormalizationDocumentReviewAction } from '@/ui/formalization/hooks/use-formalization-document-review-action'
import { useFormalizationDocumentVersionQuery } from '@/ui/formalization/hooks/use-formalization-document-version-query'
import { useFormalizationQuery } from '@/ui/formalization/hooks/use-formalization-query'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'

export type FormalizationDocumentReviewPageProps = {
  formalizationId: string
  documentVersionId: string
}

export type FormalizationDocumentReviewHistoryItem = {
  id: string
  versionNumber: number
  sourceLabel: string
  status: 'in_review' | 'approved' | 'rejected'
  statusLabel: string
  createdAtLabel: string
  rejectionReason?: string
  isCurrent: boolean
}

function cloneContent(content: DocumentTemplateContent): DocumentTemplateContent {
  return JSON.parse(JSON.stringify(content)) as DocumentTemplateContent
}

function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(typeof value === 'string' ? new Date(value) : value)
}

function statusLabel(status: DocumentVersion['status']) {
  if (status === DocumentVersionStatus.Approved) return 'Aprovado'
  if (status === DocumentVersionStatus.Rejected) return 'Rejeitado'
  return 'Em revisão'
}

function sourceLabel(source: DocumentVersionSource) {
  return source === DocumentVersionSource.Manual ? 'Edição manual' : 'Geração por IA'
}

export function useFormalizationDocumentReviewPage(
  props: FormalizationDocumentReviewPageProps,
) {
  const { navigateTo } = useNavigation()
  const formalizationQuery = useFormalizationQuery(props.formalizationId)
  const documentsQuery = useFormalizationDocumentsQuery(props.formalizationId)
  const documentVersionQuery = useFormalizationDocumentVersionQuery(
    props.formalizationId,
    props.documentVersionId,
  )
  const {
    isRegeneratingDocument,
    isReviewingVersion,
    isSavingManualVersion,
    isSelectingCurrentVersion,
    regenerateDocument,
    reviewVersion,
    saveManualVersion,
    selectCurrentVersion,
  } = useFormalizationDocumentReviewAction(props.formalizationId)
  const [draft, setDraft] = useState<DocumentTemplateContent>()
  const [savedContent, setSavedContent] = useState<DocumentTemplateContent>()
  const [isEditing, setIsEditing] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [isSaveOpen, setIsSaveOpen] = useState(false)
  const [isCancelOpen, setIsCancelOpen] = useState(false)
  const [isApproveOpen, setIsApproveOpen] = useState(false)
  const [isRejectOpen, setIsRejectOpen] = useState(false)
  const [isCurrentOpen, setIsCurrentOpen] = useState(false)
  const [isRegenerateOpen, setIsRegenerateOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [regenerationInstructions, setRegenerationInstructions] = useState('')
  const [actionError, setActionError] = useState<string>()

  const version = documentVersionQuery.documentVersion
  const document = useMemo(
    () =>
      documentsQuery.data?.find((item) =>
        item.versions.some((candidate) => candidate.id === props.documentVersionId),
      ),
    [documentsQuery.data, props.documentVersionId],
  )

  useEffect(() => {
    if (!version) return
    const nextContent = cloneContent(version.content)
    setDraft(nextContent)
    setSavedContent(nextContent)
    setIsEditing(false)
  }, [version])

  const history = useMemo<readonly FormalizationDocumentReviewHistoryItem[]>(
    () =>
      [...(document?.versions ?? [])]
        .sort((left, right) => right.versionNumber - left.versionNumber)
        .map((item) => ({
          id: item.id,
          versionNumber: item.versionNumber,
          sourceLabel: item.source === 'manual' ? 'Edição manual' : 'Geração por IA',
          status: item.status,
          statusLabel: statusLabel(item.status),
          createdAtLabel: formatDate(item.createdAt),
          rejectionReason: item.rejectionReason,
          isCurrent: document?.currentVersionId === item.id,
        })),
    [document],
  )
  const isDirty = Boolean(
    draft && savedContent && JSON.stringify(draft) !== JSON.stringify(savedContent),
  )
  const isError =
    formalizationQuery.isError ||
    documentsQuery.isError ||
    documentVersionQuery.isErrorDocumentVersion
  const viewModel =
    version && document
      ? {
          title: document.title,
          versionNumber: version.versionNumber,
          sourceLabel: sourceLabel(version.source),
          status: version.status,
          statusLabel: statusLabel(version.status),
          isCurrent: document.currentVersionId === version.id,
          isApproved: version.status === DocumentVersionStatus.Approved,
          isInReview: version.status === DocumentVersionStatus.InReview,
          isRejected: version.status === DocumentVersionStatus.Rejected,
          generationState: 'idle' as const,
          isGenerating: false,
          isGenerationFailed: false,
          createdAtLabel: formatDate(version.createdAt),
          rejectionReason: version.rejectionReason,
        }
      : undefined

  function handleBack() {
    return navigateTo('formalization', {
      params: { formalizationId: props.formalizationId },
    })
  }

  function handleVersionNavigation(versionId: string) {
    return navigateTo('formalizationDocumentVersion', {
      params: { formalizationId: props.formalizationId, documentVersionId: versionId },
    })
  }

  function handleRetry() {
    return Promise.all([
      formalizationQuery.refetch(),
      documentsQuery.refetch(),
      documentVersionQuery.refetchDocumentVersion(),
    ])
  }

  async function handleConfirmSave() {
    if (!draft || !version) return
    setActionError(undefined)
    try {
      const savedVersion = await saveManualVersion({
        versionId: version.id,
        content: draft,
      })
      setIsSaveOpen(false)
      setIsEditing(false)
      await navigateTo('formalizationDocumentVersion', {
        params: {
          formalizationId: props.formalizationId,
          documentVersionId: savedVersion.id,
        },
      })
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : 'Não foi possível salvar a versão.',
      )
    }
  }

  async function handleReview(request: ReviewFormalizationDocumentVersionRequest) {
    if (!version) {
      setActionError('Versão indisponível.')
      return
    }
    setActionError(undefined)
    try {
      await reviewVersion({ versionId: version.id, request })
      setIsApproveOpen(false)
      setIsRejectOpen(false)
      await Promise.all([
        documentVersionQuery.refetchDocumentVersion(),
        documentsQuery.refetch(),
      ])
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : 'Não foi possível concluir a decisão.',
      )
    }
  }

  async function handleConfirmCurrent() {
    if (!version || !document) {
      setActionError('Documento indisponível.')
      return
    }
    setActionError(undefined)
    try {
      await selectCurrentVersion({
        documentId: document.id,
        versionId: version.id,
      })
      setIsCurrentOpen(false)
      await documentsQuery.refetch()
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : 'Não foi possível tornar a versão vigente.',
      )
    }
  }

  async function handleConfirmRegenerate() {
    if (!document) {
      setActionError('Documento indisponível.')
      return
    }
    setActionError(undefined)
    try {
      await regenerateDocument({
        documentId: document.id,
        instructions: regenerationInstructions.trim() || undefined,
      })
      setIsRegenerateOpen(false)
      await documentsQuery.refetch()
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : 'Não foi possível gerar uma nova versão.',
      )
    }
  }

  return {
    actionError,
    draft,
    formalizationQuery,
    documentsQuery,
    documentVersionQuery,
    handleBack,
    handleVersionNavigation,
    handleRetry,
    handleConfirmSave,
    handleReview,
    handleConfirmCurrent,
    handleConfirmRegenerate,
    history,
    isApproveOpen,
    isCancelOpen,
    isCurrentOpen,
    isEditing,
    isError,
    isHistoryOpen,
    isLoading:
      formalizationQuery.isLoading ||
      documentsQuery.isLoading ||
      documentVersionQuery.isLoadingDocumentVersion,
    isRejectOpen,
    isRegenerateOpen,
    isSaveOpen,
    isDirty,
    isSaving: isSavingManualVersion,
    isSubmittingDecision: isReviewingVersion,
    isSelectingCurrent: isSelectingCurrentVersion,
    isRegenerating: isRegeneratingDocument,
    isReadOnly: formalizationQuery.data?.formalization.status !== 'in_progress',
    rejectionReason,
    regenerationInstructions,
    setDraft,
    setIsApproveOpen,
    setIsCancelOpen,
    setIsCurrentOpen,
    setIsEditing,
    setIsHistoryOpen,
    setIsRejectOpen,
    setIsRegenerateOpen,
    setIsSaveOpen,
    setRejectionReason,
    setRegenerationInstructions,
    setActionError,
    version,
    viewModel,
  }
}
