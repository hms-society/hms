import type { DocumentValidationDocument } from '@hms/core/document-engine/domain/entities'
import type { DocumentReviewFormData } from '@hms/validation/document-engine'
import type { UseFormReturn } from 'react-hook-form'

export type AnalysisFormPanelProps = {
  form: UseFormReturn<DocumentReviewFormData>
  currentDecision: string
  isSubmitting: boolean
  confidence: string
  document: DocumentValidationDocument
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>
  onRequestResend: () => void
  onOpenDocument: (documentFileId: string) => void
}

export function useAnalysisFormPanel({
  form,
  onOpenDocument,
}: Pick<AnalysisFormPanelProps, 'form' | 'onOpenDocument'>) {
  function handleOpenDuplicateDocument(documentFileId: string) {
    form.setValue('originalDocumentId', documentFileId, {
      shouldDirty: true,
      shouldValidate: true,
    })
    onOpenDocument(documentFileId)
  }

  return { handleOpenDuplicateDocument }
}
