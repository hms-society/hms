import { useQuery } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export function useIntakeQuery(intakeId?: string) {
  const { intakeService } = useRestContext()

  return useQuery({
    queryKey: ['intakes', 'by-id', intakeId],
    queryFn: async () => {
      if (!intakeId) throw new Error('Intake id is required')

      const response = await intakeService.getIntake(intakeId)
      if (response.isFailure) response.throwError()
      return response.body
    },
    enabled: Boolean(intakeId),
  })
}
