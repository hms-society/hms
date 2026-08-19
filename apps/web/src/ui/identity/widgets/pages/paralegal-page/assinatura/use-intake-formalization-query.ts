import { useQuery } from '@tanstack/react-query'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export const INTAKE_FORMALIZATION_QUERY_KEY = (intakeId: string, consultationId?: string) =>
  ['intake-formalization', intakeId, consultationId] as const

export function useIntakeFormalizationQuery(intakeId: string, consultationId?: string) {
  const { intakeService, identityService, consultationService } = useRestContext()

  return useQuery({
    queryKey: INTAKE_FORMALIZATION_QUERY_KEY(intakeId, consultationId),
    queryFn: async () => {
      const intakeResponse = await intakeService.getIntake(intakeId)
      const intake = intakeResponse.body

      const clientResponse = await identityService.getClient(intake.clientId)
      const { client, consents } = clientResponse.body
      const consultation = consultationId
        ? (await consultationService.getConsultationById(consultationId)).body
        : null

      return {
        intake,
        client,
        consents,
        consultation,
      }
    },
    enabled: Boolean(intakeId),
  })
}