import { useQuery } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export function useIntakeResponsiblesQuery() {
  const { intakeService } = useRestContext()

  return useQuery({
    queryKey: ['intake-responsibles'],
    queryFn: async () => {
      const response = await intakeService.listIntakeResponsibles()
      if (response.isFailure) response.throwError()
      return response.body
    },
    retry: false,
  })
}
