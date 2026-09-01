import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import type { DocumentValidationDocument } from '@hms/core/document-engine/domain/entities'
import {
  documentReview,
  type DocumentReviewFormData,
} from '@hms/validation/document-engine'

import { useDocumentValidationDocumentQuery } from '@/ui/document-engine/hooks/use-document-validation-document-query'
import { useRecordDocumentValidationDecisionAction } from '@/ui/document-engine/hooks/use-record-document-validation-decision-action'
import { useRequestDocumentResendAction } from '@/ui/document-engine/hooks/use-request-document-resend-action'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'

export type AnalysisDocumentView = {
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
  statusClasses: string
  failureReason?: string
  failureInstruction?: string
}

const FALLBACK_DOCUMENT: AnalysisDocumentView = {
  id: '',
  fileName: 'Carregando documento...',
  confidence: 'Sem sugestão disponível',
  type: '',
  fileSize: '0 KB',
  receivedFrom: 'Carregando',
  contactInfo: 'Carregando',
  receivedDate: 'Hoje',
  receivedTime: '--:--',
  integrity: 'Pendente',
  duplicity: 'Pendente',
  status: 'Aguardando validação',
  statusClasses: 'bg-[#E1F5F6] text-[#0F5C61]',
}

export type UseDocumentAnalysisParams = {
  fileId: string
  fromCaseId?: string
}

export function useDocumentAnalysis({ fileId, fromCaseId }: UseDocumentAnalysisParams) {
  const { navigateTo } = useNavigation()
  const [isResendModalOpen, setIsResendModalOpen] = useState(false)
  const { document, documentError, isLoadingDocument } =
    useDocumentValidationDocumentQuery(fileId)
  const { recordDecision, isRecordingDecision } =
    useRecordDocumentValidationDecisionAction(fileId)
  const { requestResend, isRequestingResend } = useRequestDocumentResendAction(fileId)

  function toAnalysisDocumentView(
    validationDocument: DocumentValidationDocument,
  ): AnalysisDocumentView {
    const receivedAt = new Date(validationDocument.receivedAt)

    return {
      id: validationDocument.id,
      fileName: validationDocument.fileName,
      confidence: getConfidenceLabel(validationDocument),
      type: getStringSuggestion(validationDocument, 'documentTypeId') ?? '',
      fileSize: formatFileSize(validationDocument.sizeBytes),
      receivedFrom: getSenderName(validationDocument),
      contactInfo: `${validationDocument.channel} - ${validationDocument.sender}`,
      receivedDate: formatReceivedDate(receivedAt),
      receivedTime: format(receivedAt, 'HH:mm'),
      integrity: 'Confirmada',
      duplicity: validationDocument.duplicateMatch
        ? 'Duplicado'
        : 'Nenhuma correspondência',
      status: getStatusLabel(validationDocument.status),
      statusClasses: getStatusStyles(getStatusLabel(validationDocument.status)),
      failureReason: validationDocument.failure?.reason,
      failureInstruction: validationDocument.failure?.instruction,
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

  function getStatusStyles(status: string) {
    switch (status) {
      case 'Falha no processamento':
      case 'Incompleto':
      case 'Reenvio solicitado':
        return 'bg-[#FFF3E0] text-[#7C4700]'
      case 'Ilegível':
        return 'bg-[#FFEBEE] text-[#7B1515]'
      case 'Validado':
      case 'Válido':
        return 'bg-[#E8F5E9] text-[#1B5E20]'
      case 'Duplicado':
        return 'bg-muted text-muted-foreground'
      default:
        return 'bg-[#E1F5F6] text-[#0F5C61]'
    }
  }

  function getConfidenceLabel(validationDocument: DocumentValidationDocument) {
    const label = getStringSuggestion(validationDocument, 'confidenceLabel')

    if (label) return label

    if (validationDocument.aiConfidence === undefined) {
      return 'Sem sugestão disponível'
    }
    if (validationDocument.aiConfidence >= 90) {
      return 'Sugerido pela IA - Confiança alta'
    }
    if (validationDocument.aiConfidence >= 60) return 'Sugerido pela IA'

    return 'Baixa confiança'
  }

  function getStringSuggestion(
    validationDocument: DocumentValidationDocument | undefined,
    key: string,
  ) {
    const value = validationDocument?.aiSuggestion?.[key]

    return typeof value === 'string' ? value : undefined
  }

  function getSenderName(validationDocument: DocumentValidationDocument) {
    const titular = validationDocument.extractedFields.find(
      (field) => field.label === 'Titular',
    )

    return titular?.value ?? validationDocument.sender
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

  const viewDocument = document ? toAnalysisDocumentView(document) : FALLBACK_DOCUMENT

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

  const onSubmit = form.handleSubmit(async (data) => {
    console.log('[document-validation] confirm validation submit', {
      documentFileId: fileId,
      documentStatus: document?.status,
      checklistLink: document?.checklistLink,
      payload: data,
    })
    await recordDecision(data)
  })

  function handleRequestResend() {
    setIsResendModalOpen(true)
  }

  function handleCloseResendModal() {
    setIsResendModalOpen(false)
  }

  async function handleConfirmResend(message: string) {
    await requestResend({
      reason: form.getValues('reason') || 'Documento incompleto',
      message,
    })
    setIsResendModalOpen(false)
  }

  function handleOpenDocument(documentFileId: string) {
    const navigationOptions = fromCaseId
      ? {
          params: { fileId: documentFileId },
          search: { fromCaseId },
        }
      : { params: { fileId: documentFileId } }

    void navigateTo('documentViewer', navigationOptions)
  }

  return {
    form,
    currentDecision,
    document,
    isLoading: isLoadingDocument,
    error: documentError,
    isSubmitting: isRecordingDecision || isRequestingResend,
    isResendModalOpen,
    onSubmit,
    handleRequestResend,
    handleCloseResendModal,
    handleConfirmResend,
    handleOpenDocument,
    documentView: viewDocument,
  }
}
