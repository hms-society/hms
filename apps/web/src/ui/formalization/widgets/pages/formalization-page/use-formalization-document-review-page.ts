import type { DocumentVersion } from '@hms/core/document-production/domain/entities'
import {
  DocumentVersionSource,
  DocumentVersionStatus,
} from '@hms/core/document-production/domain/structures'
import type { DocumentTemplateContent } from '@hms/core/document-production/domain/structures'
import type { ReviewFormalizationDocumentVersionRequest } from '@hms/core/formalization/interfaces'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'

import { useFormalizationQuery } from '@/ui/formalization/hooks/use-formalization-query'
import { formalizationQueryKeys } from '@/ui/formalization/hooks/formalization-query-keys'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
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
  const { formalizationService } = useRestContext()
  const { navigateTo } = useNavigation()
  const queryClient = useQueryClient()
  const formalizationQuery = useFormalizationQuery(props.formalizationId)
  const documentsQuery = useQuery({
    queryKey: formalizationQueryKeys.documents(props.formalizationId),
    queryFn: async () => {
      const response = await formalizationService.listDocuments(props.formalizationId)
      if (response.isFailure) response.throwError()
      return response.body
    },
    retry: false,
  })
  const versionQuery = useQuery({
    queryKey: formalizationQueryKeys.version(
      props.formalizationId,
      props.documentVersionId,
    ),
    queryFn: async () => {
      const response = await formalizationService.getVersion(
        props.formalizationId,
        props.documentVersionId,
      )
      if (response.isFailure) response.throwError()
      return response.body
    },
    retry: false,
  })
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

  const version = versionQuery.data
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

  const saveMutation = useMutation({
    mutationFn: async (content: DocumentTemplateContent) => {
      if (!version) throw new Error('Versão indisponível.')
      const response = await formalizationService.saveManualVersion(
        props.formalizationId,
        version.id,
        { sourceDocumentVersionId: version.id, content },
      )
      if (response.isFailure) response.throwError()
      return response.body
    },
    onSuccess: async (savedVersion) => {
      await queryClient.invalidateQueries({
        queryKey: formalizationQueryKeys.documents(props.formalizationId),
      })
      await navigateTo('formalizationDocumentVersion', {
        params: {
          formalizationId: props.formalizationId,
          documentVersionId: savedVersion.id,
        },
      })
    },
  })
  const reviewMutation = useMutation({
    mutationFn: async (request: ReviewFormalizationDocumentVersionRequest) => {
      if (!version) throw new Error('Versão indisponível.')
      const response = await formalizationService.reviewVersion(
        props.formalizationId,
        version.id,
        request,
      )
      if (response.isFailure) response.throwError()
      return response.body
    },
    onSuccess: async () => {
      setIsApproveOpen(false)
      setIsRejectOpen(false)
      await Promise.all([versionQuery.refetch(), documentsQuery.refetch()])
    },
  })
  const currentMutation = useMutation({
    mutationFn: async () => {
      if (!version || !document) throw new Error('Documento indisponível.')
      const response = await formalizationService.selectCurrentVersion(
        props.formalizationId,
        document.id,
        version.id,
      )
      if (response.isFailure) response.throwError()
      return response.body
    },
    onSuccess: async () => {
      setIsCurrentOpen(false)
      await documentsQuery.refetch()
    },
  })
  const regenerateMutation = useMutation({
    mutationFn: async () => {
      if (!document) throw new Error('Documento indisponível.')
      const response = await formalizationService.generateDocument(
        props.formalizationId,
        document.id,
        regenerationInstructions.trim()
          ? { instructions: regenerationInstructions.trim() }
          : undefined,
      )
      if (response.isFailure) response.throwError()
      return response.body
    },
    onSuccess: async () => {
      setIsRegenerateOpen(false)
      await documentsQuery.refetch()
    },
  })

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
    formalizationQuery.isError || documentsQuery.isError || versionQuery.isError
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
      versionQuery.refetch(),
    ])
  }

  async function handleConfirmSave() {
    if (!draft) return
    setActionError(undefined)
    try {
      await saveMutation.mutateAsync(draft)
      setIsSaveOpen(false)
      setIsEditing(false)
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : 'Não foi possível salvar a versão.',
      )
    }
  }

  async function handleReview(request: ReviewFormalizationDocumentVersionRequest) {
    setActionError(undefined)
    try {
      await reviewMutation.mutateAsync(request)
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : 'Não foi possível concluir a decisão.',
      )
    }
  }

  async function handleConfirmCurrent() {
    setActionError(undefined)
    try {
      await currentMutation.mutateAsync()
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : 'Não foi possível tornar a versão vigente.',
      )
    }
  }

  async function handleConfirmRegenerate() {
    setActionError(undefined)
    try {
      await regenerateMutation.mutateAsync()
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
    versionQuery,
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
      formalizationQuery.isLoading || documentsQuery.isLoading || versionQuery.isLoading,
    isRejectOpen,
    isRegenerateOpen,
    isSaveOpen,
    isDirty,
    isSaving: saveMutation.isPending,
    isSubmittingDecision: reviewMutation.isPending,
    isSelectingCurrent: currentMutation.isPending,
    isRegenerating: regenerateMutation.isPending,
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
