import { intakeFormSchema, type IntakeFormData } from '@hms/validation/intake'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState, type BaseSyntheticEvent } from 'react'
import { useForm } from 'react-hook-form'

import {
  ConsultationChannel,
  ConsultationModality,
} from '@hms/core/consultation/domain/structures'
import { AppError } from '@hms/core/shared/domain/errors'

import { useAuthContext } from '@/ui/shared/contexts/auth-context/use-auth-context'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'

import { useRegisterIntakeAction } from './use-register-intake-action'

const DEFAULT_VALUES: IntakeFormData = {
  origin: 'direct',
  contactChannel: 'whatsapp',
  legalAreaId: '',
  legalTopicId: '',
  urgency: 'normal',
  notes: '',
  clientId: '',
  decision: 'schedule',
  meetingMode: 'virtual',
  virtualChannel: 'whatsapp',
  location: '',
  lawyer: undefined,
  date: new Date(2026, 6, 8),
  time: '10:00',
  closureReason: undefined,
  closureNotes: '',
}

const DEMAND_FIELDS = ['origin', 'contactChannel', 'urgency'] as const

const STEP_CONTENT = {
  1: {
    title: 'Registrar demanda',
    description: 'Informe como o cliente chegou e o assunto do atendimento.',
  },
  2: {
    title: 'Vincular cliente',
    description: 'Confirme quem está solicitando o atendimento.',
  },
  3: {
    title: 'Definir próximo passo',
    description: 'Agende a consulta ou encerre o intake com um motivo.',
  },
} as const

export function useNewIntake() {
  const { user } = useAuthContext()
  const { navigateTo } = useNavigation()
  const { error, isRegisteringIntake, registerIntake } = useRegisterIntakeAction()
  const [currentStep, setCurrentStep] = useState(1)
  const [isClosureDialogOpen, setIsClosureDialogOpen] = useState(false)
  const form = useForm<IntakeFormData>({
    resolver: zodResolver(intakeFormSchema),
    mode: 'onTouched',
    defaultValues: DEFAULT_VALUES,
  })
  const decision = form.watch('decision')
  const closureReason = form.watch('closureReason')
  const isSubmitting = form.formState.isSubmitting || isRegisteringIntake
  const stepContent =
    currentStep === 3 && decision === 'close'
      ? { title: 'Novo intake', description: '' }
      : STEP_CONTENT[currentStep as keyof typeof STEP_CONTENT]

  async function submitIntake(data: IntakeFormData) {
    if (!user) throw new AppError('An authenticated user is required')

    const request = {
      clientId: data.clientId,
      responsibleId: user.id,
      origin: data.origin,
      contactChannel: data.contactChannel,
      ...(data.legalAreaId ? { legalAreaId: data.legalAreaId } : {}),
      ...(data.legalTopicId ? { legalTopicId: data.legalTopicId } : {}),
      urgency: data.urgency,
      demandNotes: data.notes,
    }

    try {
      if (data.decision === 'schedule') {
        if (!data.lawyer || !data.date || !data.time || !data.meetingMode) {
          throw new AppError('Scheduling details are required')
        }

        const [hours, minutes] = data.time.split(':').map(Number)
        const startsAt = new Date(data.date)
        startsAt.setHours(hours, minutes, 0, 0)

        const channel =
          data.virtualChannel === 'whatsapp'
            ? ConsultationChannel.WhatsappVideo
            : data.virtualChannel === 'google-meet'
              ? ConsultationChannel.GoogleMeet
              : data.virtualChannel === 'teams'
                ? ConsultationChannel.Teams
                : ConsultationChannel.Other

        await registerIntake({
          ...request,
          decision: 'schedule_consultation',
          assignedLawyerId: data.lawyer,
          startsAt,
          modality:
            data.meetingMode === 'in-person'
              ? ConsultationModality.InPerson
              : ConsultationModality.Virtual,
          channel,
        })
      } else {
        if (!data.closureReason) throw new AppError('A closure reason is required')

        await registerIntake({
          ...request,
          decision: 'close_without_contract',
          closureReason: data.closureReason,
          closureNotes: data.closureNotes,
        })
      }
    } catch {
      return
    }
    form.reset(DEFAULT_VALUES)
    setCurrentStep(1)
    await navigateTo('intakes')
  }

  function handleSubmit(event?: BaseSyntheticEvent) {
    return form.handleSubmit(submitIntake)(event)
  }

  function handleReset() {
    form.reset(DEFAULT_VALUES)
    setCurrentStep(1)
    setIsClosureDialogOpen(false)
  }

  function handlePrevious() {
    setCurrentStep(function getPreviousStep(step) {
      return Math.max(step - 1, 1)
    })
  }

  async function handleNext() {
    const isValid =
      currentStep === 1
        ? await form.trigger(DEMAND_FIELDS)
        : await form.trigger('clientId')

    if (isValid) {
      if (currentStep === 1) form.clearErrors('clientId')
      setCurrentStep(function getNextStep(step) {
        return Math.min(step + 1, 3)
      })
    }
  }

  async function handleRequestClosure() {
    const isValid = await form.trigger('closureReason')

    if (isValid) {
      setIsClosureDialogOpen(true)
    }
  }

  function handleClosureDialogChange(isOpen: boolean) {
    setIsClosureDialogOpen(isOpen)
  }

  async function handleConfirmClosure() {
    setIsClosureDialogOpen(false)
    await handleSubmit()
  }

  return {
    currentStep,
    closureReason,
    decision,
    error,
    form,
    isClosureDialogOpen,
    isSubmitting,
    stepContent,
    handleClosureDialogChange,
    handleConfirmClosure,
    handleNext,
    handlePrevious,
    handleRequestClosure,
    handleReset,
    handleSubmit,
  }
}
