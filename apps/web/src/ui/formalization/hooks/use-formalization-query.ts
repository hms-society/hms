import { useQuery } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { formalizationQueryKeys } from './formalization-query-keys'

export function useFormalizationQuery(formalizationId: string) {
  const { formalizationService } = useRestContext()

  return useQuery({
    queryKey: formalizationQueryKeys.detail(formalizationId),
    queryFn: async () => {
      const response = await formalizationService.get(formalizationId)
      if (response.isFailure) response.throwError()
      return response.body
    },
    retry: false,
  })
}
