import type { IntakeListQuery } from '@hms/core/intake/domain/structures'
import { useQuery } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export function useIntakesQuery(query: IntakeListQuery) {
  const { intakeService } = useRestContext()

  return useQuery({
    queryKey: ['intakes', query],
    queryFn: async () => {
      const response = await intakeService.listIntakes(query)
      if (response.isFailure) response.throwError()
      return response.body
    },
    retry: false,
  })
}
