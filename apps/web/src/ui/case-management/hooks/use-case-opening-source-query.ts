import { useQuery, useQueryClient } from '@tanstack/react-query'
import { HTTP_STATUS_CODE } from '@hms/core/shared/constants'

import { useCurrentCollaboratorQuery } from '@/ui/identity/hooks/use-current-collaborator-query'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export function useCaseOpeningSourceQuery(intakeId: string) {
  const { caseManagementService } = useRestContext()
  const queryClient = useQueryClient()
  const { currentCollaborator } = useCurrentCollaboratorQuery()

  async function fetchCaseOpeningSource() {
    const response = await caseManagementService.getCaseOpeningSource(intakeId)

    if (response.isFailure) {
      if (response.statusCode === HTTP_STATUS_CODE.forbidden) {
        queryClient.setQueryData(
          [
            'case-management',
            'opening-source',
            intakeId,
            currentCollaborator?.collaboratorId,
          ],
          null,
        )
      }
      response.throwError()
    }

    return response.body
  }

  const {
    data: caseOpeningSource = null,
    error: caseOpeningSourceError,
    isLoading: isLoadingCaseOpeningSource,
  } = useQuery({
    queryKey: [
      'case-management',
      'opening-source',
      intakeId,
      currentCollaborator?.collaboratorId,
    ],
    queryFn: fetchCaseOpeningSource,
    enabled: Boolean(intakeId && currentCollaborator?.collaboratorId),
    retry: false,
  })

  return {
    caseOpeningSource,
    caseOpeningSourceError,
    isLoadingCaseOpeningSource,
  }
}
