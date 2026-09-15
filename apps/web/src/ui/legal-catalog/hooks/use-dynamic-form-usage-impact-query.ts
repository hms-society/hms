import { useQuery } from '@tanstack/react-query'
import { AppError } from '@hms/core/shared/domain/errors'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export function useDynamicFormUsageImpactQuery(
  dynamicFormId: string | undefined,
  enabled = true,
) {
  const { legalCatalogService } = useRestContext()

  async function fetchUsageImpact() {
    if (!dynamicFormId) throw new AppError('Um formulário dinâmico é obrigatório.')
    const response = await legalCatalogService.getDynamicFormUsageImpact(dynamicFormId)
    if (response.isFailure) response.throwError()
    return response.body
  }

  return useQuery({
    queryKey: ['legal-catalog', 'dynamic-form-impact', dynamicFormId],
    queryFn: fetchUsageImpact,
    enabled: enabled && Boolean(dynamicFormId),
    retry: false,
  })
}
