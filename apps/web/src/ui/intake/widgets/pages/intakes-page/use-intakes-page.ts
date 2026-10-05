import { useIntakeResponsiblesQuery } from '@/ui/intake/hooks/use-intake-responsibles-query'
import { useIntakesQuery } from '@/ui/intake/hooks/use-intakes-query'

export function useIntakesPage() {
  const intakesQuery = useIntakesQuery()
  const responsibles = useIntakeResponsiblesQuery()

  return {
    ...intakesQuery,
    responsibles,
  }
}

export type IntakesPageController = ReturnType<typeof useIntakesPage>
