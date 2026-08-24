import type { DocumentValidationDocument } from '@hms/core/document-engine/domain/entities'
import type { DocumentReviewFormData } from '@hms/validation/document-engine'
import type { UseFormReturn } from 'react-hook-form'

export type ChecklistLinkFieldsProps = {
  document: DocumentValidationDocument
  form: UseFormReturn<DocumentReviewFormData>
  isChecklistDisabled?: boolean
}

export function useChecklistLinkFields({ document, form }: ChecklistLinkFieldsProps) {
  const documentTypeId = form.watch('documentTypeId')
  const checklistRequirementId = form.watch('checklistRequirementId')
  const caseLabel = document.checklistLink?.caseLabel ?? documentTypeId
  const checklistItemLabel =
    document.checklistLink?.checklistItemLabel ?? checklistRequirementId

  return {
    caseLabel,
    checklistItemLabel,
    checklistRequirementId,
    documentTypeId,
  }
}
