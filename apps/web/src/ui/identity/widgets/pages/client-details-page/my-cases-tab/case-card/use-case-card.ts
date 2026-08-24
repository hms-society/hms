import type { MouseEvent } from 'react'

import { IntakeStatus } from '@hms/core/intake/domain/structures'
import type { Intake } from '@hms/core/intake/domain/entities'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'

export function useCaseCard(intake: Intake) {
  const { navigateTo } = useNavigation()
  const hasPendency =
    intake.status === IntakeStatus.Registered ||
    intake.status === IntakeStatus.ViabilityRegistered

  function handleNavigate(event: MouseEvent) {
    event.stopPropagation()
    void navigateTo('clientMyCaseDetails', { params: { caseId: intake.id } })
  }

  return { handleNavigate, hasPendency }
}
