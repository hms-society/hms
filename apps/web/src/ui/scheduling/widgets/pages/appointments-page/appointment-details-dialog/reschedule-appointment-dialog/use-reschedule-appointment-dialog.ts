import { CollaboratorProfile, UserStatus } from '@hms/core/identity/domain/structures'
import { HTTP_STATUS_CODE } from '@hms/core/shared/constants'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'

import { SchedulingRequestError } from '@/rest/services/scheduling-service'
import { useActiveCollaboratorsQuery } from '@/ui/identity/hooks/use-active-collaborators-query'
import { useCurrentCollaboratorQuery } from '@/ui/identity/hooks/use-current-collaborator-query'
import { useAppointmentActions } from '@/ui/scheduling/hooks/use-appointment-actions'
import { useRescheduleSlots } from '@/ui/scheduling/hooks/use-reschedule-slots'
import { addCivilDays, getTodayInSaoPaulo } from '@/ui/scheduling/date-utils'
import type { AppointmentDetailsView } from '@/ui/scheduling/types'

type RescheduleForm = { date: string }

export function useRescheduleAppointmentDialog(
  open: boolean,
  detail: AppointmentDetailsView | undefined,
  onSuccess: () => void,
  onReloadDetail?: () => Promise<unknown>,
) {
  const initialDate = addCivilDays(getTodayInSaoPaulo(), 1)
  const form = useForm<RescheduleForm>({ defaultValues: { date: initialDate } })
  const date = form.watch('date')
  const currentLawyerId = detail?.lawyerId
  const { currentCollaborator } = useCurrentCollaboratorQuery()
  const canSelectLawyer =
    currentCollaborator?.profile === CollaboratorProfile.Admin ||
    currentCollaborator?.profile === CollaboratorProfile.Attendant
  const canReschedule = Boolean(
    canSelectLawyer ||
      (currentCollaborator?.profile === CollaboratorProfile.Lawyer &&
        currentCollaborator.collaboratorId === currentLawyerId),
  )
  const [selectedLawyerId, setSelectedLawyerId] = useState(detail?.lawyerId ?? '')
  const [selectedSlot, setSelectedSlot] = useState<string>()
  const [lawyerPage, setLawyerPage] = useState(1)
  const [lawyerTotalPages, setLawyerTotalPages] = useState(1)
  const [activeLawyers, setActiveLawyers] = useState<CollaboratorSummary[]>([])
  const [error, setError] = useState<Error | null>(null)
  const [hasRevisionConflict, setHasRevisionConflict] = useState(false)
  const [isReloadingConflict, setIsReloadingConflict] = useState(false)
  const hasInitializedDialogRef = useRef(false)
  const {
    collaboratorsPage,
    collaboratorsPageError,
    isLoadingCollaborators,
    refetch: activeCollaboratorsRefetch,
  } = useActiveCollaboratorsQuery({
    profile: CollaboratorProfile.Lawyer,
    status: UserStatus.Active,
    page: lawyerPage,
    pageSize: 100,
  })
  const slotsQuery = useRescheduleSlots(
    open && canReschedule ? detail?.appointmentId : undefined,
    date,
    (canSelectLawyer ? selectedLawyerId : currentLawyerId) || undefined,
  )
  const selectedSlotDetails = slotsQuery.data?.find(
    (slot) => slot.startsAt === selectedSlot,
  )
  const actions = useAppointmentActions()

  useEffect(() => {
    if (!collaboratorsPage || collaboratorsPage.page !== lawyerPage) return

    setLawyerTotalPages(collaboratorsPage.totalPages)
    setActiveLawyers((currentLawyers) => {
      const knownIds = new Set(currentLawyers.map((lawyer) => lawyer.collaboratorId))
      return [
        ...currentLawyers,
        ...collaboratorsPage.items.filter(
          (lawyer) => !knownIds.has(lawyer.collaboratorId),
        ),
      ]
    })
  }, [collaboratorsPage, lawyerPage])

  useEffect(() => {
    if (!open) {
      hasInitializedDialogRef.current = false
      return
    }
    if (!currentLawyerId || hasInitializedDialogRef.current) return

    hasInitializedDialogRef.current = true
    form.reset({ date: initialDate })
    setSelectedLawyerId(currentLawyerId)
    setSelectedSlot(undefined)
    setError(null)
    setHasRevisionConflict(false)
    setIsReloadingConflict(false)
  }, [currentLawyerId, form, initialDate, open])

  function handleDateChange() {
    setSelectedSlot(undefined)
    setError(null)
    setHasRevisionConflict(false)
  }

  function handleLawyerChange(lawyerId: string) {
    if (!canSelectLawyer) return

    setSelectedLawyerId(lawyerId)
    setSelectedSlot(undefined)
    setError(null)
    setHasRevisionConflict(false)
  }

  function handleLoadMoreLawyers() {
    if (
      !isLoadingCollaborators &&
      !collaboratorsPageError &&
      lawyerPage < lawyerTotalPages
    ) {
      setLawyerPage((currentPage) => currentPage + 1)
    }
  }

  function handleRetryLawyers() {
    void activeCollaboratorsRefetch()
  }

  function handleSlotSelect(startsAt: string) {
    setSelectedSlot(startsAt)
    setError(null)
  }

  async function handleReloadAfterConflict() {
    if (!detail || !onReloadDetail || isReloadingConflict) return

    setIsReloadingConflict(true)
    setError(null)
    try {
      await onReloadDetail()
      const refreshedSlots = await slotsQuery.refetch({ throwOnError: true })
      const selectedSlotIsAvailable = refreshedSlots.data?.some(
        (slot) => slot.startsAt === selectedSlot,
      )

      if (selectedSlotIsAvailable) {
        setHasRevisionConflict(false)
      } else {
        setSelectedSlot(undefined)
        setHasRevisionConflict(false)
        setError(
          new Error('O horário escolhido não está mais disponível. Selecione outro.'),
        )
      }
    } catch {
      setError(
        new Error(
          'Não foi possível atualizar o agendamento e os horários. Tente novamente.',
        ),
      )
    } finally {
      setIsReloadingConflict(false)
    }
  }

  function getTimeZoneLabel(timeZone: string, value: string) {
    const abbreviation = new Intl.DateTimeFormat('pt-BR', {
      timeZone,
      timeZoneName: 'short',
    })
      .formatToParts(new Date(value))
      .find((part) => part.type === 'timeZoneName')?.value
    const offset = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'shortOffset',
    })
      .formatToParts(new Date(value))
      .find((part) => part.type === 'timeZoneName')
      ?.value.replace('GMT', 'UTC')

    return abbreviation && offset ? `${abbreviation} (${offset})` : timeZone
  }

  async function handleConfirm(values: RescheduleForm) {
    const targetLawyerId = canSelectLawyer ? selectedLawyerId : currentLawyerId
    if (!canReschedule || !detail || !selectedSlot || !targetLawyerId) return

    setError(null)
    try {
      await actions.rescheduleAppointment({
        appointmentId: detail.appointmentId,
        expectedRevision: detail.updatedAt,
        startsAt: selectedSlot,
        lawyerId: targetLawyerId,
      })
      onSuccess()
    } catch (requestError) {
      if (
        requestError instanceof SchedulingRequestError &&
        requestError.statusCode === HTTP_STATUS_CODE.conflict
      ) {
        setHasRevisionConflict(true)
        setError(
          new Error(
            'O agendamento foi alterado por outra pessoa. Atualize os dados e confira o horário antes de confirmar novamente.',
          ),
        )
        return
      }

      setError(
        requestError instanceof Error
          ? requestError
          : new Error('Não foi possível remarcar o agendamento.'),
      )
    }

    void values
  }

  function getDateFieldRegistration() {
    return form.register('date', { onChange: handleDateChange })
  }

  return {
    form,
    date,
    dateFieldRegistration: getDateFieldRegistration(),
    currentTimeZoneLabel: detail
      ? getTimeZoneLabel(detail.timeZone, detail.startsAt)
      : '',
    selectedTimeZoneLabel: selectedSlotDetails
      ? getTimeZoneLabel(selectedSlotDetails.timeZone, selectedSlotDetails.startsAt)
      : '',
    activeLawyers,
    collaboratorsPageError,
    isLoadingCollaborators,
    hasMoreLawyers: lawyerPage < lawyerTotalPages,
    handleLoadMoreLawyers,
    handleRetryLawyers,
    selectedLawyerId,
    handleLawyerChange,
    slots: slotsQuery.data ?? [],
    isLoadingSlots: slotsQuery.isPending,
    slotsError: slotsQuery.error,
    selectedSlot,
    setSelectedSlot,
    handleSlotSelect,
    handleConfirm: form.handleSubmit(handleConfirm),
    isRescheduling: actions.isRescheduling,
    error,
    hasRevisionConflict,
    isReloadingConflict,
    handleReloadAfterConflict,
  }
}
