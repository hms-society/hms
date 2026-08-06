import { useState } from 'react'
import {
  ArrowLeft,
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
} from 'lucide-react'

import { Button } from '@/ui/shadcn/button'
import { Badge } from '@/ui/shadcn/badge'

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
  onContinueForm?: () => void
  onUpdateAttendanceStatus?: (status: 'confirmed' | 'rescheduled' | 'absent') => Promise<void> | void
  intakeSource?: IntakeSourceData
  demandContext?: string
  schedule?: ScheduleData
  isLoading?: boolean
}

export function ConsultationDetails({
  onContinueForm,
  onUpdateAttendanceStatus,
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

  return (
    <div className="space-y-6 pb-12 font-sans">
      <div>
        <button
          type="button"
          className="flex items-center gap-1.5 text-xs text-teal-800 font-medium cursor-default"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Voltar
        </button>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
          Informações da Origem (Intake)
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-y-3 gap-x-4 text-xs font-sans">
          <div>
            <span className="text-slate-400 block mb-0.5">Intake</span>
            <span className="font-semibold text-teal-700 hover:underline cursor-pointer flex items-center gap-1">
              <LinkIcon className="w-3 h-3" /> {isLoading ? '...' : intakeSource?.intakeCode || '—'}
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