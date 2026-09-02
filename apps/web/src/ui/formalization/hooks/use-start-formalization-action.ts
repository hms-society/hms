import { useMutation } from '@tanstack/react-query'

import { useNavigation } from '@/ui/shared/hooks/use-navigation'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export function useStartFormalizationAction() {
  const { formalizationService } = useRestContext()
  const { navigateTo } = useNavigation()

  return useMutation({
    mutationFn: async (intakeId: string) => {
      const response = await formalizationService.startByIntake(intakeId)
      if (response.isFailure) response.throwError()
      return response.body
    },
    onSuccess: (details) => {
      void navigateTo('formalization', {
        params: { formalizationId: details.formalization.id },
      }).catch(() => undefined)
    },
  })
}
