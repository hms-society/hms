import type { IntakeFormData } from '@hms/validation/intake'
import { useFormContext } from 'react-hook-form'

import { useLegalAreasQuery } from './use-legal-areas-query'
import { useLegalTopicsQuery } from './use-legal-topics-query'

export const NO_LEGAL_AREA_VALUE = '__no_legal_area__'

export function useDemandStep() {
  const form = useFormContext<IntakeFormData>()
  const selectedLegalAreaId = form.watch('legalAreaId')

  const { legalAreas, legalAreasError, isLoadingLegalAreas } = useLegalAreasQuery()
  const { legalTopics, legalTopicsError, isLoadingLegalTopics } =
    useLegalTopicsQuery(selectedLegalAreaId)

  function handleLegalAreaChange(value: string) {
    form.setValue('legalAreaId', value === NO_LEGAL_AREA_VALUE ? '' : value, {
      shouldDirty: true,
      shouldValidate: true,
    })
    form.setValue('legalTopicId', '', { shouldDirty: true })
  }

  return {
    control: form.control,
    errors: form.formState.errors,
    legalAreas,
    legalTopics,
    isLoadingLegalAreas,
    isLoadingLegalTopics,
    legalCatalogError: legalAreasError ?? legalTopicsError,
    selectedLegalAreaId,
    handleLegalAreaChange,
  }
}
