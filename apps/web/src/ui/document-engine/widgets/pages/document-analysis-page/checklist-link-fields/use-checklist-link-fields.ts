import { useQuery } from '@tanstack/react-query'
import type { DocumentValidationDocument } from '@hms/core/document-engine/domain/entities'
import type { DocumentReviewFormData } from '@hms/validation/document-engine'
import type { UseFormReturn } from 'react-hook-form'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export type ChecklistLinkFieldsProps = {
  document: DocumentValidationDocument
  form: UseFormReturn<DocumentReviewFormData>
  isChecklistDisabled?: boolean
}

export function useChecklistLinkFields({ document, form }: ChecklistLinkFieldsProps) {
  const { caseManagementService } = useRestContext()
  const caseId = form.watch('caseId')
  const checklistRequirementId = form.watch('checklistRequirementId')
  const {
    data: caseOptions = [],
    isLoading: isLoadingCases,
  } = useQuery({
    queryKey: ['case-management', 'my-cases'],
    queryFn: async () => {
      const response = await caseManagementService.listMyCases()

      if (response.isFailure) response.throwError()

      return response.body
    },
  })
  const {
    data: checklistOptions = [],
    isLoading: isLoadingChecklist,
  } = useQuery({
    queryKey: ['case-management', 'cases', caseId, 'checklist'],
    queryFn: async () => {
      const response = await caseManagementService.listCaseChecklist(caseId ?? '')

      if (response.isFailure) response.throwError()

      return response.body
    },
    enabled: Boolean(caseId),
  })
  const selectedCase = caseOptions.find((caseOption) => caseOption.id === caseId)
  const selectedChecklistItem = checklistOptions.find(
    (checklistItem) => checklistItem.id === checklistRequirementId,
  )
  const caseLabel = selectedCase?.title ?? document.checklistLink?.caseLabel ?? caseId
  const checklistItemLabel =
    selectedChecklistItem?.title ??
    document.checklistLink?.checklistItemLabel ??
    checklistRequirementId

  function handleCaseSelect(value: string) {
    form.setValue('caseId', value, {
      shouldDirty: true,
      shouldValidate: true,
    })
    form.setValue('checklistRequirementId', '', {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  function handleChecklistSelect(value: string) {
    form.setValue('checklistRequirementId', value, {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  return {
    caseLabel,
    caseId,
    caseOptions,
    checklistItemLabel,
    checklistOptions,
    checklistRequirementId,
    handleCaseSelect,
    handleChecklistSelect,
    isLoadingCases,
    isLoadingChecklist,
  }
}
