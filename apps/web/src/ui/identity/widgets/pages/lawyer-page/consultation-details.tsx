import { forwardRef, useState } from 'react'
import { Icon } from '@/ui/shared/widgets/components/icon'

import { Button } from '@/ui/shadcn/button'
import { Badge } from '@/ui/shadcn/badge'
import { useConsultation } from './use-consultation'

export interface ConsultationDetailsProps {
  consultationId: string
  onBack?: () => void
  onContinueForm?: () => void
}

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
  phone: 'Ligação Telefônica',
  email: 'E-mail',
  in_person: 'Presencial',
  video_call: 'Videochamada',
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

export const ConsultationDetails = forwardRef<HTMLDivElement, ConsultationDetailsProps>(
  ({ consultationId, onBack, onContinueForm }, ref) => {
    const {
      consultation,
      responsible,
      isLoading,
      startConsultation,
      markNoShow,
      rescheduleConsultation,
    } = useConsultation(consultationId)

    const [feedbackBanner, setFeedbackBanner] = useState<{
      type: 'success' | 'danger' | 'info'
      message: string
    } | null>(null)

    const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false)
    const [selectedDate, setSelectedDate] = useState<string>('')
    const [selectedTime, setSelectedTime] = useState<string>('')
    const [isSubmittingReschedule, setIsSubmittingReschedule] = useState(false)

    const statusLower = consultation?.status?.toLowerCase()
    const isPending = statusLower === 'pending'
    const isCompleted = statusLower === 'completed'

    const canBeStarted = isPending
    const canMarkNoShow = isPending

    const handleStatusAction = async (action: 'toggle_start' | 'toggle_absent') => {
      if (!consultationId) return

      try {
        if (action === 'toggle_start') {
          await startConsultation(consultationId)

          setFeedbackBanner({
            type: 'success',
            message: 'Consulta iniciada com sucesso!',
          })
        } else {
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

    const handleConfirmReschedule = async () => {
      if (!selectedDate || !selectedTime || !consultationId) return

      try {
        setIsSubmittingReschedule(true)
        const combinedIsoDate = new Date(
          `${selectedDate}T${selectedTime}:00`,
        ).toISOString()

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
              .map((n: string) => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase()
          : 'CL',
      badge: client?.type === 'legal' ? 'Pessoa Jurídica' : 'Pessoa Física',
      taxIdLabel: client?.taxIdType ? String(client.taxIdType).toUpperCase() : 'CPF/CNPJ',
      taxIdValue: client?.taxIdValue || '—',
      phone: client?.phone || '—',
      email: client?.email || '—',
      location: client?.city && client?.state ? `${client.city} - ${client.state}` : '—',
    }

    const rawOrigin = intakeObj?.origin || client?.origin || consultation?.channel
    const rawChannel =
      intakeObj?.contactChannel ||
      (consultation?.modality === 'PRESENTIAL' ? 'in_person' : 'video_call')
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
      (consultation as any)?.scheduledAt ||
      (consultation as any)?.appointmentDate ||
      consultation?.startedAt ||
      consultation?.createdAt

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
      format: consultation?.modality === 'PRESENTIAL' ? 'Presencial' : 'Virtual',
      lawyer:
        consultation?.assignedLawyer?.name ||
        consultation?.assignedLawyer?.professionalName ||
        'Não atribuído',
    }

    const todayString = new Date().toISOString().split('T')[0]

    return (
      <div
        ref={ref}
        className='space-y-4 sm:space-y-6 pb-8 sm:pb-12 font-sans px-3 sm:px-0 max-w-7xl mx-auto'
      >
        <div>
          <button
            type='button'
            onClick={onBack}
            className='flex items-center gap-1.5 text-xs text-teal-800 font-medium cursor-pointer hover:underline'
          >
            <Icon name='arrow-left' className='w-3.5 h-3.5' /> Voltar
          </button>
        </div>

        {feedbackBanner && (
          <div
            className={`p-3.5 sm:p-4 rounded-xl text-xs font-medium flex items-start sm:items-center justify-between gap-3 shadow-sm transition-all animate-in fade-in slide-in-from-top-2 ${
              feedbackBanner.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : feedbackBanner.type === 'danger'
                  ? 'bg-red-50 text-red-800 border border-red-200'
                  : 'bg-teal-50 text-teal-800 border border-teal-200'
            }`}
          >
            <div className='flex items-center gap-2'>
              {feedbackBanner.type === 'success' ? (
                <Icon
                  name='check'
                  className='w-4 h-4 text-emerald-600 shrink-0'
                />
              ) : feedbackBanner.type === 'danger' ? (
                <Icon name='x' className='w-4 h-4 text-red-600 shrink-0' />
              ) : (
                <Icon name='refresh-cw' className='w-4 h-4 text-teal-600 shrink-0' />
              )}
              <span className='break-words'>{feedbackBanner.message}</span>
            </div>
            <button
              type='button'
              onClick={() => setFeedbackBanner(null)}
              className='text-slate-400 hover:text-slate-600 text-xs font-bold px-1 shrink-0'
            >
              ✕
            </button>
          </div>
        )}

        <div className='bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-6 items-stretch lg:items-center justify-between'>
          <div className='flex flex-col sm:flex-row items-start gap-4 flex-1'>
            <div className='w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-teal-50 text-teal-800 font-bold text-base sm:text-lg flex items-center justify-center shrink-0 border border-teal-100'>
              {isLoading ? '...' : clientData.initials}
            </div>

            <div className='space-y-2 w-full'>
              <div className='flex items-center gap-2 flex-wrap'>
                <h2 className='text-base sm:text-lg font-bold text-slate-800 font-serif break-words'>
                  {isLoading ? 'Carregando cliente...' : clientData.name}
                </h2>
              </div>

              <div className='text-xs text-slate-500 font-medium flex items-center gap-2 flex-wrap'>
                <span>{clientData.taxIdLabel}</span>
                <span className='font-semibold text-slate-700'>
                  {isLoading ? '...' : clientData.taxIdValue}
                </span>
              </div>

              <div className='flex flex-col sm:flex-row sm:items-center gap-2 text-xs'>
                <span className='inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-slate-200 text-slate-600 bg-slate-50 truncate max-w-full'>
                  <Icon name='phone' className='w-3 h-3 text-slate-400 shrink-0' />
                  <span className='truncate'>{isLoading ? '...' : clientData.phone}</span>
                </span>
                <span className='inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-slate-200 text-slate-600 bg-slate-50 truncate max-w-full'>
                  <Icon name='mail' className='w-3 h-3 text-slate-400 shrink-0' />
                  <span className='truncate'>{isLoading ? '...' : clientData.email}</span>
                </span>
              </div>

              <div className='flex items-center gap-1 text-xs text-slate-400 pt-0.5'>
                <Icon name='map-pin' className='w-3.5 h-3.5 shrink-0' />
                <span className='truncate'>
                  {isLoading ? '...' : clientData.location}
                </span>
              </div>
            </div>
          </div>

          <div className='hidden lg:block w-px h-28 bg-slate-200' />
          <div className='block lg:hidden w-full h-px bg-slate-100 my-1' />

          <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-y-3 gap-x-4 sm:gap-x-8 text-xs font-sans w-full lg:w-auto lg:min-w-[280px]'>
            <div>
              <span className='text-slate-400 block mb-0.5'>Intake</span>
              <span className='font-semibold text-teal-700 cursor-pointer flex items-center gap-1 truncate'>
                <Icon name='link' className='w-3 h-3 shrink-0' />{' '}
                {isLoading ? '...' : intakeSource.intakeCode}
              </span>
            </div>

            <div>
              <span className='text-slate-400 block mb-0.5'>Origem</span>
              <span className='font-semibold text-slate-800 block truncate'>
                {isLoading ? '...' : intakeSource.source}
              </span>
            </div>

            <div>
              <span className='text-slate-400 block mb-0.5'>Canal</span>
              <span className='font-semibold text-slate-800 block truncate'>
                {isLoading ? '...' : intakeSource.channel}
              </span>
            </div>

            <div>
              <span className='text-slate-400 block mb-0.5'>Urgência</span>
              <Badge className='bg-teal-100/80 text-teal-800 border-none text-[10px] font-medium px-2 py-0 inline-block'>
                {intakeSource.urgency}
              </Badge>
            </div>

            <div>
              <span className='text-slate-400 block mb-0.5'>Aberto em</span>
              <span className='font-semibold text-slate-800 block truncate'>
                {isLoading ? '...' : intakeSource.openedAt}
              </span>
            </div>

            <div>
              <span className='text-slate-400 block mb-0.5'>Atendente</span>
              <span className='font-semibold text-slate-800 block truncate'>
                {isLoading ? '...' : intakeSource.attendant}
              </span>
            </div>
          </div>
        </div>

        <div className='bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 lg:p-8 space-y-3'>
          <div className='flex items-center gap-2 text-xs font-medium text-slate-500'>
            <Icon name='message-square' className='w-4 h-4 text-slate-400 shrink-0' />
            <span>Contexto da demanda</span>
          </div>
          <p className='text-sm font-serif text-slate-800 leading-relaxed break-words'>
            {isLoading
              ? 'Carregando detalhes...'
              : demandContext ||
                'Nenhum contexto detalhado registrado para esta consulta.'}
          </p>
        </div>

        <div className='bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 lg:p-8 space-y-5'>
          <div className='flex items-center justify-between border-b border-slate-100 pb-3'>
            <div className='flex items-center gap-2 text-xs font-medium text-slate-500'>
              <Icon name='calendar' className='w-4 h-4 text-slate-400 shrink-0' />
              <span>Agendamento</span>
            </div>
            {statusLower === 'rescheduled' && (
              <Badge className='bg-amber-50 text-amber-800 border-amber-200 text-[10px] font-medium px-2.5 py-0.5 shrink-0'>
                Remarcado
              </Badge>
            )}
          </div>

          <div className='space-y-3 text-xs'>
            <div className='flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-2.5 gap-1 sm:gap-0'>
              <span className='text-slate-500 flex items-center gap-2'>
                <Icon name='clock' className='w-3.5 h-3.5 text-slate-400 shrink-0' />{' '}
                Horário
              </span>
              <span className='font-semibold text-slate-800'>06/08/2026 - 14:00</span>
            </div>

            <div className='flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-2.5 gap-1 sm:gap-0'>
              <span className='text-slate-500 flex items-center gap-2'>
                <Icon name='video' className='w-3.5 h-3.5 text-slate-400 shrink-0' />{' '}
                Formato
              </span>
              <span className='font-semibold text-slate-800'>
                {isLoading ? '...' : schedule.format}
              </span>
            </div>

            <div className='flex flex-col sm:flex-row sm:items-center justify-between pb-1 gap-1 sm:gap-0'>
              <span className='text-slate-500 flex items-center gap-2'>
                <Icon name='user' className='w-3.5 h-3.5 text-slate-400 shrink-0' />{' '}
                Advogado
              </span>
              <span className='font-semibold text-slate-800 truncate'>
                {isLoading ? '...' : schedule.lawyer}
              </span>
            </div>
          </div>

          <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-slate-100'>
            <span className='text-xs text-slate-500 font-medium'>
              Atualizar presença / status:
            </span>

            <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto'>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => setIsRescheduleModalOpen(true)}
                disabled={isCompleted}
                className='rounded-full h-9 sm:h-8 text-xs font-medium gap-1.5 px-4 border-teal-700/40 text-teal-800 hover:bg-teal-50 cursor-pointer w-full sm:w-auto justify-center'
              >
                <Icon name='refresh-cw' className='w-3.5 h-3.5 shrink-0' /> Remarcar
              </Button>

              <Button
                type='button'
                size='sm'
                onClick={() => handleStatusAction('toggle_start')}
                disabled={!canBeStarted}
                className={`rounded-full h-9 sm:h-8 text-xs font-medium gap-1.5 px-4 transition-all w-full sm:w-auto justify-center ${
                  canBeStarted
                    ? 'bg-teal-800 hover:bg-teal-900 text-white cursor-pointer'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Icon name='check' className='w-3.5 h-3.5 shrink-0' />
                Iniciar consulta
              </Button>

              <Button
                type='button'
                variant='destructive'
                size='sm'
                onClick={() => handleStatusAction('toggle_absent')}
                disabled={!canMarkNoShow}
                className={`rounded-full h-9 sm:h-8 text-xs font-medium gap-1.5 px-4 transition-all w-full sm:w-auto justify-center ${
                  canMarkNoShow
                    ? 'bg-red-700 hover:bg-red-800 text-white cursor-pointer'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Icon name='user-x' className='w-3.5 h-3.5 shrink-0' />
                Marcar ausência
              </Button>
            </div>
          </div>
        </div>

        <div className='bg-white rounded-2xl border border-teal-600/60 p-4 sm:p-6 lg:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
          <div className='flex items-center gap-3.5'>
            <div className='w-10 h-10 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center shrink-0 border border-teal-100'>
              <Icon name='pencil' className='w-5 h-5' />
            </div>
            <p className='text-xs sm:text-sm font-semibold text-slate-800 font-sans'>
              Continue o preenchimento da ficha
            </p>
          </div>

          <Button
            type='button'
            onClick={onContinueForm}
            className='bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold rounded-full px-5 h-10 gap-2 w-full sm:w-auto justify-center shrink-0 shadow-sm cursor-pointer'
          >
            Continuar ficha <Icon name='arrow-right' className='w-4 h-4' />
          </Button>
        </div>

        {isRescheduleModalOpen && (
          <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in'>
            <div className='bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg p-5 sm:p-6 space-y-5 sm:space-y-6 relative max-h-[90vh] overflow-y-auto'>
              <div className='flex items-start sm:items-center justify-between border-b border-slate-100 pb-3.5'>
                <div className='flex items-center gap-2.5'>
                  <div className='w-8 h-8 rounded-full bg-teal-50 text-teal-800 flex items-center justify-center shrink-0'>
                    <Icon name='refresh-cw' className='w-4 h-4' />
                  </div>
                  <div>
                    <h3 className='text-sm sm:text-base font-bold text-slate-800 font-serif'>
                      Remarcar Consulta
                    </h3>
                    <p className='text-[11px] sm:text-xs text-slate-500 font-sans'>
                      Selecione uma nova data e horário disponível
                    </p>
                  </div>
                </div>
                <button
                  type='button'
                  onClick={() => setIsRescheduleModalOpen(false)}
                  className='p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer shrink-0'
                >
                  <Icon name='x' className='w-5 h-5' />
                </button>
              </div>

              <div className='space-y-4 font-sans'>
                <div>
                  <label className='block text-xs font-semibold text-slate-700 mb-1.5'>
                    Selecione a data
                  </label>
                  <input
                    type='date'
                    min={todayString}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className='w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 text-slate-800'
                  />
                </div>

                <div>
                  <label className='block text-xs font-semibold text-slate-700 mb-2'>
                    Horários disponíveis
                  </label>
                  <div className='grid grid-cols-2 sm:grid-cols-3 gap-2'>
                    {AVAILABLE_SLOTS.map((slot) => (
                      <button
                        key={slot}
                        type='button'
                        onClick={() => setSelectedTime(slot)}
                        className={`py-2 px-3 text-xs font-medium rounded-xl border transition-all cursor-pointer ${
                          selectedTime === slot
                            ? 'bg-teal-800 text-white border-teal-800 shadow-sm'
                            : 'border-slate-200 text-slate-700 hover:border-teal-600 hover:bg-teal-50/50'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className='flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-4 border-t border-slate-100'>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => setIsRescheduleModalOpen(false)}
                  className='rounded-full text-xs font-medium h-9 px-4 cursor-pointer w-full sm:w-auto'
                >
                  Cancelar
                </Button>
                <Button
                  type='button'
                  size='sm'
                  disabled={!selectedDate || !selectedTime || isSubmittingReschedule}
                  onClick={handleConfirmReschedule}
                  className='bg-teal-800 hover:bg-teal-900 text-white rounded-full text-xs font-semibold h-9 px-5 shadow-sm cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 w-full sm:w-auto'
                >
                  {isSubmittingReschedule ? 'Confirmando...' : 'Confirmar remarcação'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  },
)

ConsultationDetails.displayName = 'ConsultationDetails'
