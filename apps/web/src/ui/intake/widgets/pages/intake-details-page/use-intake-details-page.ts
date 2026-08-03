import { useIntakeDetailsQuery } from './use-intake-details-query'

export function useIntakeDetailsPage(intakeId: string) {
  return useIntakeDetailsQuery(intakeId)
}
