import { useQuery } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export function useIntakeDetailsQuery(intakeId: string) {
  const { intakeService } = useRestContext()

  async function fetchIntake() {
    const response = await intakeService.getIntake(intakeId)

    if (response.isFailure) response.throwError()

    return response.body
  }

  const {
    data: intake = null,
    error: intakeError,
    isLoading: isLoadingIntake,
    refetch,
  } = useQuery({
    queryKey: ['intakes', 'detail', intakeId],
    queryFn: fetchIntake,
    retry: false,
  })

  return {
    intake,
    intakeError,
    isLoadingIntake,
    refetch,
  }
}
