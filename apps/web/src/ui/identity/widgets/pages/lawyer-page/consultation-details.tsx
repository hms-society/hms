import { useState } from 'react'
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
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
  RefreshCw,
} from 'lucide-react'

import { Button } from '@/ui/shadcn/button'
import { Badge } from '@/ui/shadcn/badge'

export interface ClientData {
  name?: string
  cpf?: string
  phone?: string
  email?: string
  cityState?: string
  statusTag?: string
}

export interface IntakeSourceData {
  intakeCode?: string
  source?: string
  channel?: string
  urgency?: string
  openedAt?: string
  attendant?: string
}

export interface ScheduleData {
  dateTime?: string
  format?: string
  lawyer?: string
}

interface ConsultationDetailsProps {
  onBack?: () => void
  onContinueForm?: () => void
  onUpdateAttendanceStatus?: (status: 'confirmed' | 'rescheduled' | 'absent') => Promise<void> | void
  client?: ClientData
  intakeSource?: IntakeSourceData
  demandContext?: string
  schedule?: ScheduleData
  isLoading?: boolean
}

export function ConsultationDetails({
  onBack,
  onContinueForm,
  onUpdateAttendanceStatus,
  client,
  intakeSource,
  demandContext,
  schedule = {
    dateTime: 'Seg, 23 Jun 2026 · 11:00',
    format: 'Virtual — Vídeo WhatsApp',
    lawyer: 'Epaminondas',
  },
  isLoading = false,
}: ConsultationDetailsProps) {
  const [attendanceStatus, setAttendanceStatus] = useState<
    'confirmed' | 'rescheduled' | 'absent' | null
  >(null)

  const handleStatusChange = async (status: 'confirmed' | 'rescheduled' | 'absent') => {
    setAttendanceStatus(status)
    if (onUpdateAttendanceStatus) {
      await onUpdateAttendanceStatus(status)
    }
  }

  const getInitials = (name?: string) => {
    if (!name) return '--'
    const parts = name.trim().split(' ')
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  return (
    <div className="space-y-6 pb-12 font-sans">
      {onBack && (
        <div>
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs text-teal-800 hover:text-teal-900 font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar
          </button>
        </div>
      )}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        <div className="md:col-span-7 flex items-start gap-4 pr-0 md:pr-4 border-b md:border-b-0 md:border-r border-slate-100 pb-4 md:pb-0">
          <div className="w-14 h-14 rounded-full bg-teal-100/70 text-teal-800 font-serif font-bold text-lg flex items-center justify-center shrink-0">
            {isLoading ? '...' : getInitials(client?.name)}
          </div>

          <div className="space-y-2.5 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-serif font-bold text-slate-800 truncate">
                {isLoading ? 'Carregando...' : client?.name || 'Cliente não identificado'}
              </h1>
              {client?.statusTag && (
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px] font-normal rounded-full px-2.5 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" />
                  {client.statusTag}
                </Badge>
              )}
            </div>

            <p className="text-xs text-slate-500 font-mono">
              CPF <span className="font-semibold text-slate-700">{client?.cpf || '—'}</span>
            </p>

            <div className="flex items-center gap-2 flex-wrap text-xs text-slate-600">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-full border border-slate-200/80">
                <Phone className="w-3 h-3 text-slate-400" />
                {client?.phone || 'Sem telefone'}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-full border border-slate-200/80">
                <Mail className="w-3 h-3 text-slate-400" />
                {client?.email || 'Sem e-mail'}
              </span>
            </div>

            <p className="text-xs text-slate-400 flex items-center gap-1 pt-0.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {client?.cityState || 'Localização não informada'}
            </p>
          </div>
        </div>

        <div className="md:col-span-5 grid grid-cols-2 gap-y-3 gap-x-4 text-xs font-sans">
          <div>
            <span className="text-slate-400 block mb-0.5">Intake</span>
            <span className="font-semibold text-teal-700 hover:underline cursor-pointer flex items-center gap-1">
              <LinkIcon className="w-3 h-3" /> {intakeSource?.intakeCode || '—'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Origem</span>
            <span className="font-semibold text-slate-700">{intakeSource?.source || '—'}</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Canal</span>
            <span className="font-semibold text-slate-700">{intakeSource?.channel || '—'}</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Urgência</span>
            {intakeSource?.urgency ? (
              <Badge className="bg-emerald-100 text-emerald-800 border-none text-[10px] font-medium px-2 py-0">
                {intakeSource.urgency}
              </Badge>
            ) : (
              <span className="font-semibold text-slate-700">—</span>
            )}
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Aberto em</span>
            <span className="font-semibold text-slate-700">{intakeSource?.openedAt || '—'}</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Atendente</span>
            <span className="font-semibold text-slate-700">{intakeSource?.attendant || '—'}</span>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-3">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <MessageSquare className="w-4 h-4 text-slate-400" />
          <span>Contexto da demanda</span>
        </div>
        <p className="text-sm font-serif text-slate-800 leading-relaxed">
          {demandContext || 'Nenhum contexto detalhado registrado para esta consulta.'}
        </p>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-5">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 border-b border-slate-100 pb-3">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span>Agendamento</span>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <span className="text-slate-500 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-slate-400" /> Horário
            </span>
            <span className="font-semibold text-slate-800">{schedule.dateTime || '—'}</span>
          </div>

          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <span className="text-slate-500 flex items-center gap-2">
              <Video className="w-3.5 h-3.5 text-slate-400" /> Formato
            </span>
            <span className="font-semibold text-slate-800">{schedule.format || '—'}</span>
          </div>

          <div className="flex items-center justify-between pb-1">
            <span className="text-slate-500 flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-slate-400" /> Advogado
            </span>
            <span className="font-semibold text-slate-800">{schedule.lawyer || '—'}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <span className="text-xs text-slate-500 font-medium">Atualizar presença:</span>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange('rescheduled')}
              className={`rounded-full h-8 text-xs font-medium gap-1.5 px-4 border-teal-700/40 text-teal-800  ${
                attendanceStatus === 'rescheduled' ? 'bg-teal-100 border-teal-700' : ''
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" /> Remarcar
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={() => handleStatusChange('confirmed')}
              className={`rounded-full h-8 text-xs font-medium gap-1.5 px-4 bg-teal-800 hover:bg-teal-900 text-white ${
                attendanceStatus === 'confirmed' ? 'ring-2 ring-teal-900' : ''
              }`}
            >
              <Check className="w-3.5 h-3.5" /> Confirmar
            </Button>

            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => handleStatusChange('absent')}
              className={`rounded-full h-8 text-xs font-medium gap-1.5 px-4 bg-red-700 hover:bg-red-800 text-white ${
                attendanceStatus === 'absent' ? 'ring-2 ring-red-900' : ''
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
    </div>
  )
}