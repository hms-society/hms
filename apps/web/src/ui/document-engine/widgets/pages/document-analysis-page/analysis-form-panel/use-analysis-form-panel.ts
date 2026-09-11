import type { DocumentValidationDocument } from '@hms/core/document-engine/domain/entities'
import type { DocumentReviewFormData } from '@hms/validation/document-engine'
import type { UseFormReturn } from 'react-hook-form'

type SavedDecisionNotice = {
  title: string
  description: string
}

export type AnalysisFormPanelProps = {
  form: UseFormReturn<DocumentReviewFormData>
  currentDecision: string
  isSubmitting: boolean
  document: DocumentValidationDocument
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>
  onRequestResend: () => void
  onOpenDocument: (documentFileId: string) => void
}

export function useAnalysisFormPanel({
  form,
  currentDecision,
  document,
  onOpenDocument,
}: Pick<
  AnalysisFormPanelProps,
  'currentDecision' | 'document' | 'form' | 'onOpenDocument'
>) {
  const isDuplicateAlreadyConfirmed =
    currentDecision === 'duplicate' &&
    document.status === 'duplicate' &&
    document.reviewedAt !== undefined

  const savedDecisionNotice = getSavedDecisionNotice(currentDecision, document)

  function handleOpenDuplicateDocument(documentFileId: string) {
    form.setValue('originalDocumentId', documentFileId, {
      shouldDirty: true,
      shouldValidate: true,
    })
    onOpenDocument(documentFileId)
  }

  return {
    isDuplicateAlreadyConfirmed,
    savedDecisionNotice,
    handleOpenDuplicateDocument,
  }
}

function getSavedDecisionNotice(
  currentDecision: string,
  document: DocumentValidationDocument,
): SavedDecisionNotice | null {
  if (document.reviewedAt === undefined) return null

  const reviewerName = document.reviewedByName?.trim() || 'responsável não identificado'
  const reviewedAt = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(document.reviewedAt))
  const registrationDetails = `Registrado por ${reviewerName} em ${reviewedAt}.`

  if (currentDecision === 'validate') {
    return {
      title: 'Documento já validado',
      description: `${registrationDetails} Revise os dados antes de alterar a decisão.`,
    }
  }

  if (currentDecision === 'duplicate') {
    return {
      title: 'Duplicidade já confirmada',
      description: `${registrationDetails} O documento original permanece como referência.`,
    }
  }

  if (currentDecision === 'not_linked') {
    return {
      title: 'Decisão salva: não vinculado',
      description: `${registrationDetails} Você ainda pode alterar o resultado, selecionar caso e checklist, e salvar uma nova decisão.`,
    }
  }

  if (currentDecision === 'illegible') {
    return {
      title: 'Decisão salva: ilegível',
      description: `${registrationDetails} Altere o resultado se uma nova revisão permitir processá-lo.`,
    }
  }

  if (currentDecision === 'incomplete') {
    return {
      title: 'Decisão salva: incompleto',
      description: `${registrationDetails} Você pode ajustar os campos e registrar uma nova decisão.`,
    }
  }

  if (currentDecision === 'mismatch') {
    return {
      title: 'Decisão salva: não correspondente',
      description: `${registrationDetails} Atualize o vínculo ou o resultado quando necessário.`,
    }
  }

  if (currentDecision === 'escalate') {
    return {
      title: 'Decisão salva: análise jurídica',
      description: `${registrationDetails} Você pode atualizar a decisão após nova revisão.`,
    }
  }

  return {
    title: 'Decisão já salva',
    description: `${registrationDetails} Revise as informações antes de salvar alterações.`,
  }
}
