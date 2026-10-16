import type { IntakeFormData } from '@hms/validation/intake'
import { useQuery } from '@tanstack/react-query'
import { useFormContext } from 'react-hook-form'
import { useEffect, useState } from 'react'

import type { LawyerOption } from '@/ui/identity/widgets/components/lawyer-selector-dialog'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export type IntakeDecision = IntakeFormData['decision']
export type MeetingMode = NonNullable<IntakeFormData['meetingMode']>

export function useDecisionStep() {
  const form = useFormContext<IntakeFormData>()
  const decision = form.watch('decision')
  const meetingMode = form.watch('meetingMode')
  const virtualChannel = form.watch('virtualChannel')
  const selectedLawyer = form.watch('lawyer')
  const selectedDate = form.watch('date')
  const selectedTime = form.watch('time')
  const [selectedLawyerDetails, setSelectedLawyerDetails] = useState<LawyerOption>()
  const { schedulingService } = useRestContext()
  const scheduleQuery = useQuery({
    queryKey: ['schedule', selectedLawyer],
    enabled: Boolean(selectedLawyer && schedulingService),
    queryFn: async () => {
      const response = await schedulingService.getByCollaborator(selectedLawyer as string)
      if (response.isFailure) response.throwError()
      return response.body
    },
  })
  const blockedPeriods = scheduleQuery.data?.blockedPeriods ?? []
  const calendarQuery = useQuery({
    queryKey: ['schedule-appointments', selectedLawyer, selectedDate],
    enabled: Boolean(selectedLawyer && selectedDate && schedulingService),
    queryFn: async () => {
      const response = await schedulingService.listCalendar({
        view: 'month',
        date: formatCalendarDate(selectedDate as Date),
        event: 'scheduled',
        lawyerId: selectedLawyer as string,
      })
      if (response.isFailure) response.throwError()
      return response.body
    },
  })
  const scheduleTimeZone = scheduleQuery.data?.timeZone ?? 'America/Sao_Paulo'

  useEffect(
    function clearSelectedLawyerDetailsWhenFormResets() {
      if (!selectedLawyer) setSelectedLawyerDetails(undefined)
    },
    [selectedLawyer],
  )

  function handleDecisionChange(value: IntakeDecision) {
    form.setValue('decision', value, { shouldDirty: true, shouldValidate: true })
  }

  function handleMeetingModeChange(value: MeetingMode) {
    form.setValue('meetingMode', value, {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  function handleLawyerChange(lawyer: LawyerOption) {
    form.setValue('lawyer', lawyer.value, {
      shouldDirty: true,
      shouldValidate: true,
    })
    setSelectedLawyerDetails(lawyer)
  }

  function handleVirtualChannelChange(value: string) {
    form.setValue('virtualChannel', value, {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  function handleDateChange(value: Date | undefined) {
    form.setValue('date', value, { shouldDirty: true, shouldValidate: true })
  }

  function handleTimeChange(value: string) {
    form.setValue('time', value, { shouldDirty: true, shouldValidate: true })
  }

  function isDateBlocked(date: Date) {
    const dateValue = formatCalendarDate(date)
    return blockedPeriods.some(
      (period: { startsOn: string; endsOn: string }) =>
        period.startsOn <= dateValue && period.endsOn >= dateValue,
    )
  }

  function isTimeUnavailable(time: string) {
    if (!selectedDate) return false
    const selectedDateValue = formatCalendarDate(selectedDate)
    return (calendarQuery.data ?? []).some((event) => {
      if (event.kind !== 'appointment') return false
      const eventDate = new Intl.DateTimeFormat('en-CA', {
        timeZone: scheduleTimeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date(event.startsAt))
      const eventTime = new Intl.DateTimeFormat('en-GB', {
        timeZone: scheduleTimeZone,
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      }).format(new Date(event.startsAt))
      return eventDate === selectedDateValue && eventTime === time
    })
  }

  return {
    control: form.control,
    decision,
    errors: form.formState.errors,
    meetingMode,
    selectedDate,
    selectedLawyer,
    selectedLawyerDetails,
    selectedTime,
    isDateBlocked,
    isTimeUnavailable,
    virtualChannel,
    handleDateChange,
    handleDecisionChange,
    handleMeetingModeChange,
    handleLawyerChange,
    handleTimeChange,
    handleVirtualChannelChange,
  }
}

function formatCalendarDate(date: Date): `${number}-${number}-${number}` {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}` as `${number}-${number}-${number}`
}
