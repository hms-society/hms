import { useState } from 'react'

import { useConsultation } from '@/ui/consultation/hooks/use-consultation'

const originMap: Record<string, string> = {
  social_media: 'Redes Sociais',
  website: 'Website / Plataforma',
  referral: 'Indicação',
  phone: 'Telefone',
  active_search: 'Busca Ativa',
  direct: 'Entrada direta HMS',
}

const channelMap: Record<string, string> = {
  whatsapp: 'WhatsApp',
  whatsapp_video: 'Vídeo pelo WhatsApp',
  phone: 'Ligação Telefônica',
  email: 'E-mail',
  in_person: 'Presencial',
  video_call: 'Videochamada',
  google_meet: 'Google Meet',
  teams: 'Microsoft Teams',
  other: 'Outro',
}

const AVAILABLE_SLOTS = [
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '13:30',
  '14:30',
  '15:30',
  '16:30',
  '17:30',
]

export type ConsultationDetailsProps = {
  consultationId: string
  onContinueForm?: () => void
}

export function useConsultationDetails({ consultationId }: ConsultationDetailsProps) {
  const {
    consultation,
    responsible,
    isLoading,
    isError,
    error,
    markNoShow,
    rescheduleConsultation,
  } = useConsultation(consultationId)

  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: 'success' | 'danger' | 'info'
    message: string
  } | null>(null)
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [isSubmittingReschedule, setIsSubmittingReschedule] = useState(false)

  const statusLower = consultation?.status?.toLowerCase()
  const isPending = statusLower === 'pending'
  const isCompleted = statusLower === 'completed'
  const canMarkNoShow = isPending

  async function handleStatusAction(action: 'toggle_absent') {
    if (!consultationId) return

    try {
      if (action === 'toggle_absent') {
        await markNoShow(consultationId)
        setFeedbackBanner({
          type: 'danger',
          message: 'Ausência registrada com sucesso.',
        })
      }
    } catch {
      setFeedbackBanner({
        type: 'danger',
        message: 'Ocorreu um erro ao atualizar o status.',
      })
    }
  }

  function handleMarkNoShow() {
    return handleStatusAction('toggle_absent')
  }

  async function handleConfirmReschedule() {
    if (!selectedDate || !selectedTime || !consultationId) return

    try {
      setIsSubmittingReschedule(true)
      const combinedIsoDate = new Date(`${selectedDate}T${selectedTime}:00`).toISOString()

      await rescheduleConsultation(consultationId)

      if (consultation) {
        consultation.status = 'pending' as any
        ;(consultation as any).scheduledAt = combinedIsoDate
      }

      setIsRescheduleModalOpen(false)
      setSelectedDate('')
      setSelectedTime('')
      setFeedbackBanner({
        type: 'info',
        message: `Consulta remarcada para ${new Date(combinedIsoDate).toLocaleDateString('pt-BR')} às ${selectedTime}.`,
      })
    } catch {
      setFeedbackBanner({
        type: 'danger',
        message: 'Ocorreu um erro ao remarcar a consulta. Tente novamente.',
      })
    } finally {
      setIsSubmittingReschedule(false)
    }
  }

  function handleOpenReschedule() {
    setIsRescheduleModalOpen(true)
  }

  function handleCloseReschedule() {
    setIsRescheduleModalOpen(false)
  }

  function handleDismissFeedback() {
    setFeedbackBanner(null)
  }

  function handleDateChange(value: string) {
    setSelectedDate(value)
  }

  function handleTimeChange(value: string) {
    setSelectedTime(value)
  }

  const intakeObj = consultation?.intake as any
  const demandContext = intakeObj?.demandNotes || consultation?.primaryLegalQuestion
  const client = consultation?.client
  const displayName =
    client?.name || client?.legalName || client?.tradeName || 'Cliente sem nome'
  const clientData = {
    name: displayName,
    initials:
      displayName !== 'Cliente sem nome'
        ? displayName
            .split(' ')
            .filter(Boolean)
            .map((name: string) => name[0])
            .slice(0, 2)
            .join('')
            .toUpperCase()
        : 'CL',
    taxIdLabel: client?.taxIdType
      ? String(client.taxIdType).toUpperCase()
      : client?.taxId?.type
        ? String(client.taxId.type).toUpperCase()
        : 'CPF/CNPJ',
    taxIdValue: client?.taxIdValue || client?.taxId?.value || '—',
    phone: client?.phone || '—',
    email: client?.email || '—',
    location:
      client?.city && client?.state
        ? `${client.city} - ${client.state}`
        : client?.address?.city && client?.address?.state
          ? `${client.address.city} - ${client.address.state}`
          : '—',
  }
  const rawOrigin = intakeObj?.origin || client?.origin || consultation?.channel
  const rawChannel =
    intakeObj?.contactChannel ||
    (['in_person', 'presential'].includes(
      String(consultation?.modality || '').toLowerCase(),
    )
      ? 'in_person'
      : 'video_call')
  const rawUrgency = intakeObj?.urgency || 'normal'
  const urgencyMap: Record<string, string> = {
    urgent: 'Urgente',
    normal: 'Normal',
    high: 'Alta',
  }
  const intakeSource = {
    intakeCode: intakeObj?.code
      ? intakeObj.code
      : intakeObj?.sequenceNumber
        ? `INT-${String(intakeObj.sequenceNumber).padStart(4, '0')}`
        : consultation?.intakeId
          ? `INT-${consultation.intakeId.slice(0, 4).toUpperCase()}`
          : '—',
    source: rawOrigin ? originMap[rawOrigin] || rawOrigin : '—',
    channel: rawChannel ? channelMap[rawChannel] || rawChannel : '—',
    urgency: urgencyMap[rawUrgency] || 'Normal',
    openedAt: consultation?.createdAt
      ? new Date(consultation.createdAt).toLocaleDateString('pt-BR')
      : '—',
    attendant:
      responsible?.professionalName ||
      (consultation as any)?.attendant?.name ||
      intakeObj?.attendantName ||
      'Não informado',
  }
  const currentScheduledAt =
    (consultation as any)?.appointment?.startsAt ||
    (consultation as any)?.scheduledAt ||
    (consultation as any)?.appointmentDate
  const schedule = {
    dateTime: currentScheduledAt
      ? new Date(currentScheduledAt).toLocaleString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '—',
    format: consultation?.modality
      ? ['in_person', 'presential'].includes(String(consultation.modality).toLowerCase())
        ? 'Presencial'
        : 'Virtual'
      : 'Não informado',
    lawyer:
      consultation?.assignedLawyer?.name ||
      consultation?.assignedLawyer?.professionalName ||
      'Não atribuído',
  }
  const todayString = new Date().toISOString().split('T')[0]

  return {
    consultation,
    isLoading,
    isError,
    error,
    feedbackBanner,
    isRescheduleModalOpen,
    selectedDate,
    selectedTime,
    isSubmittingReschedule,
    statusLower,
    isCompleted,
    canMarkNoShow,
    clientData,
    demandContext,
    intakeSource,
    schedule,
    todayString,
    availableSlots: AVAILABLE_SLOTS,
    handleMarkNoShow,
    handleOpenReschedule,
    handleCloseReschedule,
    handleDismissFeedback,
    handleDateChange,
    handleTimeChange,
    handleConfirmReschedule,
  }
}
