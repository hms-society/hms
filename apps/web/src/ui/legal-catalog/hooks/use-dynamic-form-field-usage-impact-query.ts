import { useQuery } from '@tanstack/react-query'
import { AppError } from '@hms/core/shared/domain/errors'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function useDynamicFormFieldUsageImpactQuery(
  dynamicFormId: string | undefined,
  fieldId: string | undefined,
  enabled = true,
) {
  const { legalCatalogService } = useRestContext()
  const isEnabled =
    enabled && Boolean(dynamicFormId && fieldId) && UUID_PATTERN.test(fieldId ?? '')

  return useQuery({
    queryKey: ['legal-catalog', 'dynamic-form-field-impact', dynamicFormId, fieldId],
    queryFn: async () => {
      if (!dynamicFormId || !fieldId) {
        throw new AppError('O formulário e o campo são obrigatórios.')
      }
      const response = await legalCatalogService.getDynamicFormFieldUsageImpact(
        dynamicFormId,
        fieldId,
      )
      if (response.isFailure) response.throwError()
      return response.body
    },
    enabled: isEnabled,
    retry: false,
  })
}
