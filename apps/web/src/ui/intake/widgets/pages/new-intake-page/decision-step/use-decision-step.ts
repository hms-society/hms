import type { IntakeFormData } from '@hms/validation/intake'
import { useFormContext } from 'react-hook-form'

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

  function handleDecisionChange(value: IntakeDecision) {
    form.setValue('decision', value, { shouldDirty: true, shouldValidate: true })
  }

  function handleMeetingModeChange(value: MeetingMode) {
    form.setValue('meetingMode', value, {
      shouldDirty: true,
      shouldValidate: true,
    })
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

  function handleClosureReasonChange(
    value: NonNullable<IntakeFormData['closureReason']>,
  ) {
    form.setValue('closureReason', value, {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  return {
    control: form.control,
    decision,
    errors: form.formState.errors,
    meetingMode,
    selectedDate,
    selectedLawyer,
    selectedTime,
    virtualChannel,
    handleClosureReasonChange,
    handleDateChange,
    handleDecisionChange,
    handleMeetingModeChange,
    handleTimeChange,
    handleVirtualChannelChange,
  }
}
