import { forwardRef, useState } from 'react'
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Clock,
  Video,
  User,
  RotateCcw,
  Check,
  UserX,
  FileEdit,
  ArrowRight,
  MessageSquare,
  Link as LinkIcon,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  XCircle,
  X,
} from 'lucide-react'

import { Button } from '@/ui/shadcn/button'
import { Badge } from '@/ui/shadcn/badge'
import { useConsultation } from './use-consultation'

export interface ConsultationDetailsProps {
  consultationId: string
  onBack?: () => void
  onContinueForm?: () => void
}

const MOCK_SCHEDULED_AT = '2026-08-06T14:00:00.000Z'

const originMap: Record<string, string> = {
  social_media: 'Redes Sociais',
  website: 'Website / Plataforma',
  referral: 'Indicação',
  phone: 'Telefone',
  active_search: 'Busca Ativa',
}

const channelMap: Record<string, string> = {
  whatsapp: 'WhatsApp',
  phone: 'Ligação Telefônica',
  email: 'E-mail',
  in_person: 'Presencial',
  video_call: 'Videochamada',
}

const AVAILABLE_SLOTS = [
  '08:00', '09:00', '10:00', '11:00',
  '13:30', '14:30', '15:30', '16:30', '17:30'
]

export const ConsultationDetails = forwardRef<HTMLDivElement, ConsultationDetailsProps>(
  ({ consultationId, onBack, onContinueForm }, ref) => {
    const {
      consultation,
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
    const canBeStarted = statusLower === 'pending' || statusLower === 'scheduled'

    const handleStatusChange = async (status: 'confirmed' | 'rescheduled' | 'absent') => {
      if (!consultationId) return

      try {
        if (status === 'confirmed') {
          if (!canBeStarted) {
            setFeedbackBanner({
              type: 'info',
              message: 'Apenas consultas pendentes podem ser iniciadas.',
            })
            return
          }
          await startConsultation(consultationId)
          setFeedbackBanner({
            type: 'success',
            message: 'Consulta iniciada com sucesso!',
          })
        } else if (status === 'absent') {
          await markNoShow(consultationId)
          setFeedbackBanner({
            type: 'danger',
            message: 'Ausência registrada com sucesso.',
          })
        }
      } catch (error) {
        setFeedbackBanner({
          type: 'danger',
          message: 'Ocorreu um erro ao atualizar o status. Tente novamente.',
        })
      }
    }

    const handleConfirmReschedule = async () => {
      if (!selectedDate || !selectedTime || !consultationId) return

      try {
        setIsSubmittingReschedule(true)
        const combinedIsoDate = new Date(`${selectedDate}T${selectedTime}:00`).toISOString()
        
        await rescheduleConsultation({
          id: consultationId,
          newDate: combinedIsoDate,
        })

        setIsRescheduleModalOpen(false)
        setSelectedDate('')
        setSelectedTime('')

        setFeedbackBanner({
          type: 'info',
          message: `Agendamento remarcado com sucesso para ${new Date(combinedIsoDate).toLocaleDateString('pt-BR')} às ${selectedTime}.`,
        })
      } catch (error) {
        setFeedbackBanner({
          type: 'danger',
          message: 'Ocorreu um erro ao remarcar a consulta. Tente novamente.',
        })
      } finally {
        setIsSubmittingReschedule(false)
      }
    }

    const demandContext =
      consultation?.primaryLegalQuestion ||
      consultation?.guidanceProvided ||
      consultation?.notes ||
      consultation?.intake?.demandNotes

    const attendanceStatus: 'confirmed' | 'rescheduled' | 'absent' | null =
      statusLower === 'in_progress' || statusLower === 'completed'
        ? 'confirmed'
        : statusLower === 'no_show'
        ? 'absent'
        : statusLower === 'rescheduled'
        ? 'rescheduled'
        : null

    const client = consultation?.client
    const displayName = client?.name || client?.legalName || client?.tradeName || 'Cliente HMS Teste'

    const clientData = {
      name: displayName,
      initials: displayName !== 'Cliente sem nome'
        ? displayName
            .split(' ')
            .map((n: string) => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase()
        : 'CL',
      badge: client?.type === 'legal' ? 'Pessoa Jurídica' : 'Pessoa Física',
      taxIdLabel: client?.taxIdType ? String(client.taxIdType).toUpperCase() : 'CPF/CNPJ',
      taxIdValue: client?.taxIdValue || client?.cpf || '123.456.789-00',
      phone: client?.phone || '(12) 98765-4321',
      email: client?.email || 'cliente@email.com',
      location:
        client?.city && client?.state
          ? `${client.city} - ${client.state}`
          : 'São José dos Campos - SP',
    }

    const intakeObj = consultation?.intake
    const rawOrigin = intakeObj?.origin || intakeObj?.source || consultation?.channel
    const rawChannel = intakeObj?.contactChannel || (consultation?.modality === 'PRESENTIAL' ? 'in_person' : 'video_call')
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
      attendant: intakeObj?.attendantName || 'Sistema',
    }

    const schedule = {
      dateTime: MOCK_SCHEDULED_AT
        ? new Date(MOCK_SCHEDULED_AT).toLocaleString('pt-BR', {
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
        'Advogado de desenvolvimento',
    }

    const todayString = new Date().toISOString().split('T')[0]

    return (
      <div ref={ref} className="space-y-6 pb-12 font-sans">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs text-teal-800 font-medium cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar
          </button>
        </div>

        {feedbackBanner && (
          <div
            className={`p-4 rounded-xl text-xs font-medium flex items-center justify-between shadow-sm transition-all animate-in fade-in slide-in-from-top-2 ${
              feedbackBanner.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : feedbackBanner.type === 'danger'
                ? 'bg-red-50 text-red-800 border border-red-200'
                : 'bg-teal-50 text-teal-800 border border-teal-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedbackBanner.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : feedbackBanner.type === 'danger' ? (
                <XCircle className="w-4 h-4 text-red-600" />
              ) : (
                <RotateCcw className="w-4 h-4 text-teal-600" />
              )}
              <span>{feedbackBanner.message}</span>
            </div>
            <button
              onClick={() => setFeedbackBanner(null)}
              className="text-slate-400 hover:text-slate-600 text-xs font-bold px-1"
            >
              ✕
            </button>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
          <div className="flex items-start gap-4 flex-1">
            <div className="w-14 h-14 rounded-full bg-teal-50 text-teal-800 font-bold text-lg flex items-center justify-center shrink-0 border border-teal-100">
              {isLoading ? '...' : clientData.initials}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-slate-800 font-serif">
                  {isLoading ? 'Carregando cliente...' : clientData.name}
                </h2>
                <Badge className="bg-teal-50 text-teal-800 border-teal-200 text-[10px] font-normal px-2.5 py-0.5 rounded-full">
                  {clientData.badge}
                </Badge>
              </div>

              <div className="text-xs text-slate-500 font-medium flex items-center gap-2">
                <span>{clientData.taxIdLabel}</span>
                <span className="font-semibold text-slate-700">
                  {isLoading ? '...' : clientData.taxIdValue}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-slate-200 text-slate-600 bg-slate-50">
                  <Phone className="w-3 h-3 text-slate-400" />
                  {isLoading ? '...' : clientData.phone}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-slate-200 text-slate-600 bg-slate-50">
                  <Mail className="w-3 h-3 text-slate-400" />
                  {isLoading ? '...' : clientData.email}
                </span>
              </div>

              <div className="flex items-center gap-1 text-xs text-slate-400 pt-0.5">
                <MapPin className="w-3.5 h-3.5" />
                <span>{isLoading ? '...' : clientData.location}</span>
              </div>
            </div>
          </div>

          <div className="hidden lg:block w-px h-28 bg-slate-200" />

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-y-3 gap-x-8 text-xs font-sans min-w-[280px]">
            <div>
              <span className="text-slate-400 block mb-0.5">Intake</span>
              <span className="font-semibold text-teal-700 cursor-pointer flex items-center gap-1">
                <LinkIcon className="w-3 h-3" /> {isLoading ? '...' : intakeSource.intakeCode}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">Origem</span>
              <span className="font-semibold text-slate-800">
                {isLoading ? '...' : intakeSource.source}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">Canal</span>
              <span className="font-semibold text-slate-800">
                {isLoading ? '...' : intakeSource.channel}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">Urgência</span>
              <Badge className="bg-teal-100/80 text-teal-800 border-none text-[10px] font-medium px-2 py-0">
                {intakeSource.urgency}
              </Badge>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">Aberto em</span>
              <span className="font-semibold text-slate-800">
                {isLoading ? '...' : intakeSource.openedAt}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">Atendente</span>
              <span className="font-semibold text-slate-800">
                {isLoading ? '...' : intakeSource.attendant}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-3">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <MessageSquare className="w-4 h-4 text-slate-400" />
            <span>Contexto da demanda</span>
          </div>
          <p className="text-sm font-serif text-slate-800 leading-relaxed">
            {isLoading
              ? 'Carregando detalhes...'
              : demandContext || 'Nenhum contexto detalhado registrado para esta consulta.'}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-5">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 border-b border-slate-100 pb-3">
            <CalendarIcon className="w-4 h-4 text-slate-400" />
            <span>Agendamento</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <span className="text-slate-500 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-slate-400" /> Horário
              </span>
              <span className="font-semibold text-slate-800">
                {isLoading ? '...' : schedule.dateTime}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <span className="text-slate-500 flex items-center gap-2">
                <Video className="w-3.5 h-3.5 text-slate-400" /> Formato
              </span>
              <span className="font-semibold text-slate-800">
                {isLoading ? '...' : schedule.format}
              </span>
            </div>

            <div className="flex items-center justify-between pb-1">
              <span className="text-slate-500 flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-slate-400" /> Advogado
              </span>
              <span className="font-semibold text-slate-800">
                {isLoading ? '...' : schedule.lawyer}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <span className="text-xs text-slate-500 font-medium">Atualizar presença:</span>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsRescheduleModalOpen(true)}
                disabled={statusLower === 'completed' || statusLower === 'no_show'}
                className={`rounded-full h-8 text-xs font-medium gap-1.5 px-4 border-teal-700/40 text-teal-800 ${
                  attendanceStatus === 'rescheduled' ? 'bg-teal-100 border-teal-700' : ''
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" /> Remarcar
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={() => handleStatusChange('confirmed')}
                disabled={!canBeStarted}
                className={`rounded-full h-8 text-xs font-medium gap-1.5 px-4 bg-teal-800 hover:bg-teal-900 text-white ${
                  attendanceStatus === 'confirmed'
                    ? 'ring-2 ring-teal-900 bg-teal-900'
                    : !canBeStarted
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                {canBeStarted ? 'Iniciar consulta' : 'Presença confirmada'}
              </Button>

              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => handleStatusChange('absent')}
                disabled={statusLower === 'completed'}
                className={`rounded-full h-8 text-xs font-medium gap-1.5 px-4 bg-red-700 hover:bg-red-800 text-white ${
                  attendanceStatus === 'absent' ? 'ring-2 ring-red-900 bg-red-900' : ''
                }`}
              >
                <UserX className="w-3.5 h-3.5" /> Marcar ausência
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-teal-600/60 p-6 sm:p-8 shadow-sm flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center shrink-0 border border-teal-100">
              <FileEdit className="w-5 h-5" />
            </div>
            <p className="text-sm font-semibold text-slate-800 font-sans">
              Continue o preenchimento da ficha
            </p>
          </div>

          <Button
            type="button"
            onClick={onContinueForm}
            className="bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold rounded-full px-5 h-10 gap-2 shrink-0 shadow-sm"
          >
            Continuar ficha <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
        {isRescheduleModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg p-6 space-y-6 relative">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-800 flex items-center justify-center">
                    <RotateCcw className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800 font-serif">Remarcar Consulta</h3>
                    <p className="text-xs text-slate-500 font-sans">Selecione uma nova data e horário disponível</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRescheduleModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 font-sans">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Selecione a data
                  </label>
                  <input
                    type="date"
                    min={todayString}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Horários disponíveis
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {AVAILABLE_SLOTS.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedTime(slot)}
                        className={`py-2 px-3 text-xs font-medium rounded-xl border transition-all ${
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

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsRescheduleModalOpen(false)}
                  className="rounded-full text-xs font-medium h-9 px-4"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={!selectedDate || !selectedTime || isSubmittingReschedule}
                  onClick={handleConfirmReschedule}
                  className="bg-teal-800 hover:bg-teal-900 text-white rounded-full text-xs font-semibold h-9 px-5 shadow-sm"
                >
                  {isSubmittingReschedule ? 'Confirmando...' : 'Confirmar remarcação'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }
)

ConsultationDetails.displayName = 'ConsultationDetails'