import { AppError } from '@hms/core/shared/domain/errors'
import type { UseFormReturn } from 'react-hook-form'
import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { CaseEligibleCollaborator } from '@hms/core/case-management/domain/structures'
import type { CreateCaseData } from '@hms/validation/case-management'
import { useCaseOpeningSourceQuery } from '@/ui/case-management/hooks/use-case-opening-source-query'
import { useIntakesListQuery } from '@/ui/intake/hooks/use-intakes-list-query'
import { useLegalAreasQuery } from '@/ui/intake/widgets/pages/new-intake-page/demand-step/use-legal-areas-query'
import { useLegalTopicsQuery } from '@/ui/intake/widgets/pages/new-intake-page/demand-step/use-legal-topics-query'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export function useCreateCaseLookups(
  form: UseFormReturn<CreateCaseData>,
  initialManager: CaseEligibleCollaborator | null,
  setInitialManager: (manager: CaseEligibleCollaborator | null) => void,
  intakeSearch: string,
) {
  const selectedIntakeId = form.watch('intakeId')
  const selectedLegalAreaId = form.watch('legalAreaId')
  const intakesQuery = useIntakesListQuery({
    page: 1,
    pageSize: 10,
    search: intakeSearch,
    status: 'contracted',
  })
  const { legalAreas } = useLegalAreasQuery()
  const { legalTopics } = useLegalTopicsQuery(selectedLegalAreaId)
  const opening = useCaseOpeningSourceQuery(selectedIntakeId)
  const { intakeService } = useRestContext()
  const selectedIntakeDetails = useQuery({
    queryKey: ['intake', selectedIntakeId],
    queryFn: () => getSelectedIntake(intakeService, selectedIntakeId),
    enabled: Boolean(selectedIntakeId),
  })

  useEffect(() => {
    const suggestion = opening.caseOpeningSource?.suggestedManager
    if (
      !selectedIntakeId ||
      opening.caseOpeningSource?.intakeId !== selectedIntakeId ||
      initialManager ||
      !suggestion
    )
      return
    setInitialManager(suggestion)
    form.setValue('initialManagerCollaboratorId', suggestion.collaboratorId, {
      shouldValidate: true,
    })
  }, [
    form,
    initialManager,
    opening.caseOpeningSource,
    selectedIntakeId,
    setInitialManager,
  ])

  useEffect(() => {
    const details = selectedIntakeDetails.data
    if (!details) return
    if (details.legalAreaId) form.setValue('legalAreaId', details.legalAreaId)
    if (
      details.legalTopicId &&
      legalTopics.some((topic) => topic.id === details.legalTopicId)
    ) {
      form.setValue('legalTopicId', details.legalTopicId)
    }
  }, [form, legalTopics, selectedIntakeDetails.data])

  return {
    caseOpeningSource: opening.caseOpeningSource,
    caseOpeningSourceError: opening.caseOpeningSourceError,
    isLoadingCaseOpeningSource: opening.isLoadingCaseOpeningSource,
    intakes: intakesQuery.data?.items ?? [],
    intakesQuery,
    legalAreas,
    legalTopics,
    selectedIntakeId,
    selectedLegalAreaId,
  }
}

async function getSelectedIntake(
  intakeService: ReturnType<typeof useRestContext>['intakeService'],
  intakeId: string,
) {
  const response = await intakeService.getIntake(intakeId)
  if (response.isFailure) throw new AppError('Falha ao buscar triagem')
  return response.body
}
