import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Intake } from '@hms/core/intake/domain/entities'
import { updateIntakeSchema, type UpdateIntakeFormData } from '@hms/validation/intake'
import { useEffect } from 'react'
import { useForm, type Resolver } from 'react-hook-form'

import { useAuthContext } from '@/ui/shared/contexts/auth-context/use-auth-context'
import { useIntakeResponsiblesQuery } from '@/ui/intake/hooks/use-intake-responsibles-query'
import { useLegalAreasQuery } from '@/ui/intake/widgets/pages/new-intake-page/demand-step/use-legal-areas-query'
import { useLegalTopicsQuery } from '@/ui/intake/widgets/pages/new-intake-page/demand-step/use-legal-topics-query'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import type { IntakeDetailsData } from '../use-intake-details-query'

export type IntakeEditDialogProps = {
  open: boolean
  intake: Intake
  onOpenChange: (open: boolean) => void
}

export function useIntakeEditDialog({
  open,
  intake,
  onOpenChange,
}: IntakeEditDialogProps) {
  const { intakeService } = useRestContext()
  const { user } = useAuthContext()
  const queryClient = useQueryClient()
  const form = useForm<UpdateIntakeFormData, unknown, UpdateIntakeFormData>({
    resolver: zodResolver(updateIntakeSchema) as Resolver<
      UpdateIntakeFormData,
      unknown,
      UpdateIntakeFormData
    >,
    mode: 'onChange',
    defaultValues: createDefaultValues(intake, user?.id ?? ''),
  })
  const selectedLegalAreaId = form.watch('legalAreaId')
  const legalAreasQuery = useLegalAreasQuery()
  const legalTopicsQuery = useLegalTopicsQuery(selectedLegalAreaId ?? '')
  const responsiblesQuery = useIntakeResponsiblesQuery()

  const updateMutation = useMutation({
    mutationFn: async (values: UpdateIntakeFormData) => {
      const response = await intakeService.updateIntake(intake.id, values)

      if (response.isFailure) response.throwError()

      return response.body
    },
    onSuccess: (updatedIntake) => {
      queryClient.setQueryData<IntakeDetailsData>(
        ['intakes', 'detail', intake.id],
        (current) => (current ? { ...current, intake: updatedIntake } : current),
      )
      form.reset(createDefaultValues(updatedIntake, user?.id ?? ''))
      onOpenChange(false)
    },
  })

  useEffect(() => {
    if (!open) return

    form.reset(createDefaultValues(intake, user?.id ?? ''))
  }, [form, intake, open, user?.id])

  function handleLegalAreaChange(value: string) {
    form.setValue('legalAreaId', value, { shouldDirty: true, shouldValidate: true })
    form.setValue('legalTopicId', '', { shouldDirty: true, shouldValidate: true })
  }

  function handleSubmit(values: UpdateIntakeFormData) {
    updateMutation.mutate(values)
  }

  return {
    form,
    handleLegalAreaChange,
    handleSubmit,
    isPending: updateMutation.isPending,
    error: updateMutation.error,
    legalAreas: legalAreasQuery.legalAreas,
    legalTopics: legalTopicsQuery.legalTopics,
    responsibles: responsiblesQuery.data ?? [],
    isLoadingOptions:
      legalAreasQuery.isLoadingLegalAreas ||
      legalTopicsQuery.isLoadingLegalTopics ||
      responsiblesQuery.isLoading,
    optionsError:
      legalAreasQuery.legalAreasError ??
      legalTopicsQuery.legalTopicsError ??
      responsiblesQuery.error,
  }
}

function createDefaultValues(intake: Intake, userId: string): UpdateIntakeFormData {
  return {
    expectedVersion: intake.version,
    updatedBy: userId,
    responsibleId: intake.responsibleId,
    origin: intake.origin,
    contactChannel: intake.contactChannel,
    legalAreaId: intake.legalAreaId ?? '',
    legalTopicId: intake.legalTopicId ?? '',
    urgency: intake.urgency,
    demandNotes: intake.demandNotes ?? '',
  }
}
