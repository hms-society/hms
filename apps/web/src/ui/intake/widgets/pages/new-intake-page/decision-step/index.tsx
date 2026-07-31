import { forwardRef, useImperativeHandle } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { ptBR } from 'date-fns/locale'

import { Avatar, AvatarFallback } from '@/ui/shadcn/avatar'
import { Badge } from '@/ui/shadcn/badge'
import { Calendar } from '@/ui/shadcn/calendar'
import { Input } from '@/ui/shadcn/input'
import { Label } from '@/ui/shadcn/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/shadcn/select'
import { Separator } from '@/ui/shadcn/separator'
import { Textarea } from '@/ui/shadcn/textarea'

import {
  AlertTriangle,
  CalendarDays,
  Clock,
  DoorOpen,
  Info,
  MapPin,
  MessageCircle,
  Monitor,
  MoreHorizontal,
  Video,
} from 'lucide-react'

import type { StepRef } from '../demand-step'
import { useDecisionStep } from '@/ui/intake/widgets/pages/new-intake-page/decision-step/use-decision-step'

const CANAIS_VIRTUAIS = [
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { value: 'google-meet', label: 'Google Meet', icon: Video },
  { value: 'teams', label: 'Teams', icon: Monitor },
  { value: 'other', label: 'Outro', icon: MoreHorizontal },
]

const ADVOGADOS_MOCK: Record<
  string,
  { nome: string; especialidade: string; iniciais: string; horarios: number }
> = {
  epaminondas: {
    nome: 'Adv. Epaminondas',
    especialidade: 'Trabalhista',
    iniciais: 'EP',
    horarios: 12,
  },
  'maria-silva': {
    nome: 'Adv. Maria Silva',
    especialidade: 'Cível',
    iniciais: 'MS',
    horarios: 8,
  },
}

const LAWYERS_OPTIONS = [
  { value: 'epaminondas', label: 'Adv. Epaminondas — Trabalhista' },
  { value: 'maria-silva', label: 'Adv. Maria Silva — Cível' },
]

const HORARIOS = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00']

const MOTIVOS_ENCERRAMENTO = [
  { value: 'out_of_scope', label: 'Fora do escopo' },
  { value: 'legally_unviable', label: 'Inviável juridicamente' },
  { value: 'client_withdrew', label: 'Cliente desistiu' },
  { value: 'unable_to_contact', label: 'Sem contato' },
  { value: 'referred', label: 'Encaminhado' },
  { value: 'other', label: 'Outro' },
] as const

export const DecisionStep = forwardRef<StepRef>((_, ref) => {
  const { trigger } = useFormContext()

  const {
    control,
    decision,
    errors,
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
  } = useDecisionStep()

  useImperativeHandle(ref, () => ({
    validate: async () => {
      if (decision === 'schedule') {
        const fields = ['meetingMode', 'lawyer', 'date', 'time']
        if (meetingMode === 'virtual') fields.push('virtualChannel')
        if (meetingMode === 'in-person') fields.push('location')
        return await trigger(fields as any)
      } else {
        return await trigger(['closureReason'] as any)
      }
    },
  }))

  const advogadoDetalhes = selectedLawyer ? ADVOGADOS_MOCK[selectedLawyer] : null

  return (
    <div className='flex flex-col gap-5'>
      {/* Botões Superiores de Decisão */}
      <div className='grid grid-cols-2 gap-4'>
        <button
          type='button'
          onClick={() => handleDecisionChange('schedule')}
          className={`flex flex-col items-center gap-1 py-4 rounded-xl border-2 transition-colors ${
            decision === 'schedule'
              ? 'border-primary bg-primary/5 text-primary'
              : 'border-border bg-card text-muted-foreground'
          }`}
        >
          <CalendarDays className='w-5 h-5' />
          <span className='text-[13px] font-serif'>Agendar consulta</span>
        </button>
        <button
          type='button'
          onClick={() => handleDecisionChange('close')}
          className={`flex flex-col items-center gap-1 py-4 rounded-xl border-2 transition-colors ${
            decision === 'close'
              ? 'border-destructive bg-destructive/5 text-destructive'
              : 'border-border bg-card text-muted-foreground'
          }`}
        >
          <DoorOpen className='w-5 h-5' />
          <span className='text-[13px] font-serif'>Encerrar atendimento</span>
        </button>
      </div>

      <Separator />

      {decision === 'schedule' && (
        <div className='flex flex-col gap-5'>
          <div className='flex items-center gap-2'>
            <CalendarDays className='w-4 h-4 text-primary' />
            <span className='text-[14px] font-serif text-foreground'>
              Dados do agendamento
            </span>
          </div>

          {/* Modalidade */}
          <div className='flex flex-col gap-1.5'>
            <Label>
              Modalidade <span className='text-destructive'>*</span>
            </Label>
            <div className='grid grid-cols-2 gap-2'>
              {[
                { value: 'virtual', label: 'Virtual — WhatsApp', icon: Monitor },
                { value: 'in-person', label: 'Presencial', icon: MapPin },
              ].map(({ value, label, icon: Icon }) => (
                <button
                  type='button'
                  key={value}
                  onClick={() =>
                    handleMeetingModeChange(value as 'virtual' | 'in-person')
                  }
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 text-[13px] font-medium transition-colors ${
                    meetingMode === value
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-card text-muted-foreground'
                  }`}
                >
                  <Icon className='w-4 h-4' />
                  {label}
                </button>
              ))}
            </div>
            {errors.meetingMode && (
              <span className='text-[12px] text-destructive'>
                {errors.meetingMode.message}
              </span>
            )}
          </div>

          {/* Canal Virtual */}
          {meetingMode === 'virtual' && (
            <div className='flex flex-col gap-1.5'>
              <Label>
                Canal (Virtual) <span className='text-destructive'>*</span>
              </Label>
              <div className='grid grid-cols-2 sm:grid-cols-4 gap-2'>
                {CANAIS_VIRTUAIS.map(({ value, label, icon: Icon }) => (
                  <button
                    type='button'
                    key={value}
                    onClick={() => handleVirtualChannelChange(value)}
                    className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-lg border-2 text-[12px] transition-colors ${
                      virtualChannel === value
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border bg-card text-muted-foreground'
                    }`}
                  >
                    <Icon className='w-4 h-4' />
                    {label}
                  </button>
                ))}
              </div>
              {errors.virtualChannel && (
                <span className='text-[12px] text-destructive'>
                  {errors.virtualChannel.message}
                </span>
              )}
            </div>
          )}

          {/* Local Presencial */}
          {meetingMode === 'in-person' && (
            <div className='flex flex-col gap-1.5'>
              <Label htmlFor='location'>
                Local <span className='text-destructive'>*</span>
              </Label>
              <Controller
                name='location'
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id='location'
                    value={field.value ?? ''}
                    placeholder='Endereço ou sala de atendimento'
                  />
                )}
              />
              {errors.location && (
                <span className='text-[12px] text-destructive'>
                  {errors.location.message}
                </span>
              )}
            </div>
          )}

          {/* Advogado */}
          <div className='flex flex-col gap-2'>
            <Label htmlFor='lawyer'>
              Advogado <span className='text-destructive'>*</span>
            </Label>
            <Controller
              name='lawyer'
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value ?? ''}>
                  <SelectTrigger id='lawyer' className='w-full'>
                    <SelectValue placeholder='Selecione um advogado...' />
                  </SelectTrigger>
                  <SelectContent>
                    {LAWYERS_OPTIONS.map((a) => (
                      <SelectItem key={a.value} value={a.value}>
                        {a.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.lawyer && (
              <span className='text-[12px] text-destructive'>
                {errors.lawyer.message}
              </span>
            )}
            {advogadoDetalhes && (
              <div className='flex items-center gap-3 bg-muted/40 border border-border rounded-xl p-3'>
                <Avatar>
                  <AvatarFallback className='bg-primary/15 text-primary text-[12px] font-bold'>
                    {advogadoDetalhes.iniciais}
                  </AvatarFallback>
                </Avatar>
                <div className='flex flex-col'>
                  <span className='text-[13px] text-foreground font-medium'>
                    {advogadoDetalhes.nome}
                  </span>
                  <span className='text-[11px] text-muted-foreground'>
                    {advogadoDetalhes.especialidade}
                  </span>
                </div>
                <Badge
                  variant='outline'
                  className='ml-auto text-primary border-primary/20 bg-primary/5 rounded-pill'
                >
                  <Clock className='w-3 h-3 mr-1' />
                  {advogadoDetalhes.horarios} horários nos próximos 7 dias
                </Badge>
              </div>
            )}
          </div>

          <Separator />

          {/* CARD DO CALENDÁRIO E HORÁRIOS */}
          <div className='rounded-2xl border border-border bg-card/60 p-4 sm:p-5 flex flex-col md:flex-row gap-6 shadow-sm'>
            {/* Lado Esquerdo: Calendário */}
            <div className='flex flex-col items-center justify-center bg-background rounded-xl border border-border/80 p-3 shadow-xs min-w-[280px]'>
              <Calendar
                mode='single'
                selected={selectedDate}
                onSelect={handleDateChange}
                locale={ptBR}
                className='p-0'
              />
            </div>

            {/* Lado Direito: Horários */}
            <div className='flex flex-col gap-4 flex-1 justify-center'>
              <div className='flex items-center justify-between pb-2 border-b border-border/60'>
                <span className='text-[13px] text-foreground font-semibold capitalize'>
                  {selectedDate
                    ? selectedDate.toLocaleDateString('pt-BR', {
                        weekday: 'long',
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })
                    : 'Selecione uma data'}
                </span>
              </div>

              <div className='grid grid-cols-2 sm:grid-cols-3 gap-2'>
                {HORARIOS.map((h) => (
                  <button
                    type='button'
                    key={h}
                    disabled={h === '14:00'}
                    onClick={() => handleTimeChange(h)}
                    className={`py-2.5 px-3 rounded-lg border text-[13px] transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
                      selectedTime === h
                        ? 'border-primary bg-primary text-primary-foreground font-semibold shadow-xs'
                        : 'border-border/80 bg-background text-foreground hover:border-primary/50'
                    }`}
                  >
                    {h}
                  </button>
                ))}
              </div>

              {errors.date && (
                <span className='text-[12px] text-destructive'>
                  {errors.date.message}
                </span>
              )}
              {errors.time && (
                <span className='text-[12px] text-destructive'>
                  {errors.time.message}
                </span>
              )}

              <div className='flex items-center gap-1.5 text-[11px] text-muted-foreground bg-muted/40 px-3 py-2 rounded-lg border border-border/50 mt-1'>
                <Clock className='w-3.5 h-3.5 text-primary shrink-0' />
                <span>
                  Duração padrão: <strong>45 min</strong> · término calculado
                  automaticamente
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Seção Encerrar Atendimento */}
      {decision === 'close' && (
        <div className='flex flex-col gap-4'>
          <div className='flex flex-col gap-4 border border-destructive/30 bg-card rounded-xl p-4'>
            <div className='flex items-center gap-2 text-destructive'>
              <AlertTriangle className='w-4 h-4' />
              <span className='text-[14px] font-serif font-medium'>
                Motivo do encerramento
              </span>
            </div>
            <div className='flex flex-col gap-1.5'>
              <Label htmlFor='closureReason'>
                Motivo <span className='text-destructive'>*</span>
              </Label>
              <Controller
                name='closureReason'
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value ?? ''}>
                    <SelectTrigger id='closureReason' className='w-full' size='sm'>
                      <SelectValue placeholder='Selecione...' />
                    </SelectTrigger>
                    <SelectContent>
                      {MOTIVOS_ENCERRAMENTO.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <div className='flex flex-wrap gap-1.5 pt-1'>
                {MOTIVOS_ENCERRAMENTO.map((reason) => (
                  <button
                    key={reason.value}
                    type='button'
                    onClick={() => handleClosureReasonChange(reason.value)}
                    className='rounded-full border border-border px-2.5 py-1 text-[10px] text-muted-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring'
                  >
                    {reason.label}
                  </button>
                ))}
              </div>

              {errors.closureReason && (
                <span className='text-[12px] text-destructive'>
                  {errors.closureReason.message}
                </span>
              )}
            </div>
            <div className='flex flex-col gap-1.5'>
              <Label htmlFor='closureNotes'>
                Observações{' '}
                <span className='text-muted-foreground font-normal'>(opcional)</span>
              </Label>
              <Controller
                name='closureNotes'
                control={control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    id='closureNotes'
                    value={field.value ?? ''}
                    placeholder='Detalhes sobre o encerramento...'
                    className='resize-none min-h-[90px]'
                  />
                )}
              />
              {errors.closureNotes && (
                <span className='text-[12px] text-destructive'>
                  {errors.closureNotes.message}
                </span>
              )}
            </div>
          </div>

          <div className='flex items-center gap-2 bg-muted/50 border border-border rounded-lg px-3 py-2'>
            <Info className='w-4 h-4 text-primary shrink-0' />
            <span className='text-[12px] text-primary'>
              O cadastro da pessoa é preservado para futuros intakes
            </span>
          </div>
        </div>
      )}
    </div>
  )
})

DecisionStep.displayName = 'DecisionStep'
