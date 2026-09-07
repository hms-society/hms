import type { IntakeService } from '@hms/core/intake/interfaces'
import { useMutation } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

type RegisterIntakeRequest = Parameters<IntakeService['registerIntake']>[0]

export const useRegisterIntakeAction = () => {
  const { intakeService } = useRestContext()
  const { mutateAsync, isPending, error } = useMutation({
    mutationFn: async function registerIntakeRequest(request: RegisterIntakeRequest) {
      const response = await intakeService.registerIntake(request)

      if (response.isFailure) response.throwError()

      return response.body
    },
  })

  return {
    error,
    isRegisteringIntake: isPending,
    registerIntake: mutateAsync,
  }
}
