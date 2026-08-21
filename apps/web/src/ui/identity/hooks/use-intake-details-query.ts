import { useQuery } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { AppError } from '@hms/core/domain/errors'

export function useIntakeDetailsQuery(caseId?: string) {
  const { intakeService } = useRestContext()

  const {
    data: caseDetails,
    error: caseDetailsError,
    isLoading: isLoadingCaseDetails,
  } = useQuery({
    queryKey: ['intake', caseId],
    queryFn: async () => {
      if (!caseId) throw new AppError('Case ID is required')
      const response = await intakeService.getIntake(caseId)
      if (response.isFailure) response.throwError()
      return response.body
    },
    enabled: !!caseId,
  })

  return { caseDetails, caseDetailsError, isLoadingCaseDetails }
}
