import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { toast } from 'sonner'
import type { DocumentValidationDocument } from '@hms/core/document-engine/domain/entities'

import { useNavigation } from '@/ui/shared/hooks/use-navigation'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { documentReview, type DocumentReviewFormData } from '../schemas/schema'

type AnalysisDocumentView = {
  id: string
  fileName: string
  confidence: string
  type: string
  fileSize: string
  receivedFrom: string
  contactInfo: string
  receivedDate: string
  receivedTime: string
  integrity: string
  duplicity: string
  status: string
  failureReason?: string
  failureInstruction?: string
}

const FALLBACK_DOCUMENT: AnalysisDocumentView = {
  id: '',
  fileName: 'Carregando documento...',
  confidence: 'Aguardando IA',
  type: '',
  fileSize: '0 KB',
  receivedFrom: 'Carregando',
  contactInfo: 'Carregando',
  receivedDate: 'Hoje',
  receivedTime: '--:--',
  integrity: 'Pendente',
  duplicity: 'Pendente',
  status: 'Aguardando validação',
}

export const useDocumentAnalysis = ({ fileId }: { fileId: string }) => {
  const { documentValidationService } = useRestContext()
  const queryClient = useQueryClient()
  const { navigateTo } = useNavigation()
  const [isResendModalOpen, setIsResendModalOpen] = useState(false)

  const {
    data: document,
    error,
    isLoading,
  } = useQuery({
    queryKey: ['document-validation', 'documents', fileId],
    queryFn: async () => {
      const response = await documentValidationService.getDocument(fileId)

      if (response.isFailure) response.throwError()

      return response.body
    },
  })

  const viewDocument = useMemo(
    () => (document ? toAnalysisDocumentView(document) : FALLBACK_DOCUMENT),
    [document],
  )

  const form = useForm<DocumentReviewFormData>({
    resolver: zodResolver(documentReview),
    mode: 'onTouched',
    values: {
      decision: mapStatusToDecision(viewDocument.status),
      documentTypeId:
        getStringSuggestion(document, 'documentTypeId') || viewDocument.type || '',
      checklistRequirementId:
        document?.checklistLink?.checklistItemId ??
        getStringSuggestion(document, 'checklistItemId') ??
        '',
      reason: document?.humanCorrection?.reason ?? '',
      originalDocumentId:
        document?.duplicateMatch?.documentFileId ??
        document?.humanCorrection?.originalDocumentId ??
        '',
    },
  })

  const currentDecision = form.watch('decision')

  const { mutateAsync: submitReview, isPending: isSubmitting } = useMutation({
    mutationFn: async (data: DocumentReviewFormData) => {
      const response = await documentValidationService.recordDecision(fileId, data)

      if (response.isFailure) response.throwError()

      return response.body
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['document-validation', 'documents'],
      })
      toast.success('Documento revisado com sucesso.')
      await navigateTo('documentInbox')
    },
    onError: () => {
      toast.error('Ocorreu um erro ao processar a validação do documento.')
    },
  })

  const { mutateAsync: requestResend, isPending: isRequestingResend } = useMutation({
    mutationFn: async (message: string) => {
      const response = await documentValidationService.requestResend(fileId, {
        reason: form.getValues('reason') || 'Documento incompleto',
        message,
      })

      if (response.isFailure) response.throwError()

      return response.body
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['document-validation', 'documents'],
      })
      setIsResendModalOpen(false)
      toast.success('Solicitação de reenvio encaminhada com sucesso.')
    },
    onError: () => {
      toast.error('Ocorreu um erro ao solicitar o reenvio do documento.')
    },
  })

  const onSubmit = form.handleSubmit(async (data) => {
    await submitReview(data)
  })

  function handleRequestResend() {
    setIsResendModalOpen(true)
  }

  function handleCloseResendModal() {
    setIsResendModalOpen(false)
  }

  async function handleConfirmResend(message: string) {
    await requestResend(message)
  }

  return {
    form,
    currentDecision,
    isLoading,
    error,
    isSubmitting: isSubmitting || isRequestingResend,
    isResendModalOpen,
    onSubmit,
    handleRequestResend,
    handleCloseResendModal,
    handleConfirmResend,
    mockDocument: viewDocument,
  }
}

function toAnalysisDocumentView(
  document: DocumentValidationDocument,
): AnalysisDocumentView {
  const receivedAt = new Date(document.receivedAt)

  return {
    id: document.id,
    fileName: document.fileName,
    confidence: getConfidenceLabel(document),
    type: getStringSuggestion(document, 'documentTypeId') ?? '',
    fileSize: formatFileSize(document.sizeBytes),
    receivedFrom: getSenderName(document),
    contactInfo: `${document.channel} - ${document.sender}`,
    receivedDate: formatReceivedDate(receivedAt),
    receivedTime: format(receivedAt, 'HH:mm'),
    integrity: 'Confirmada',
    duplicity: document.duplicateMatch ? 'Duplicado' : 'Nenhuma correspondência',
    status: getStatusLabel(document.status),
    failureReason: document.failure?.reason,
    failureInstruction: document.failure?.instruction,
  }
}

function mapStatusToDecision(status: string): DocumentReviewFormData['decision'] {
  switch (status) {
    case 'Não vinculado':
      return 'not_linked'
    case 'Ilegível':
      return 'illegible'
    case 'Incompleto':
    case 'Reenvio solicitado':
      return 'incomplete'
    case 'Duplicado':
      return 'duplicate'
    case 'Não correspondente':
      return 'mismatch'
    default:
      return 'validate'
  }
}

function getStatusLabel(status: DocumentValidationDocument['status']) {
  const labels: Record<DocumentValidationDocument['status'], string> = {
    awaiting_validation: 'Aguardando validação',
    validated: 'Válido',
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

function getConfidenceLabel(document: DocumentValidationDocument) {
  const label = getStringSuggestion(document, 'confidenceLabel')

  if (label) return label

  if (document.aiConfidence === undefined) return 'Aguardando IA'
  if (document.aiConfidence >= 90) return 'Sugerido pela IA - Confiança alta'
  if (document.aiConfidence >= 60) return 'Sugerido pela IA'

  return 'Baixa confiança'
}

function getStringSuggestion(
  document: DocumentValidationDocument | undefined,
  key: string,
) {
  const value = document?.aiSuggestion?.[key]

  return typeof value === 'string' ? value : undefined
}

function getSenderName(document: DocumentValidationDocument) {
  const titular = document.extractedFields.find((field) => field.label === 'Titular')

  return titular?.value ?? document.sender
}

function formatReceivedDate(date: Date) {
  const today = new Date()
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)

  if (isSameDay(date, today)) return 'Hoje'
  if (isSameDay(date, yesterday)) return 'Ontem'

  return format(date, 'dd/MM/yyyy')
}

function isSameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  )
}

function formatFileSize(sizeBytes: number) {
  if (sizeBytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(sizeBytes / 1024))} KB`
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`
}
