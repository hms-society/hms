import { forwardRef, useImperativeHandle, useState } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { ptBR } from 'date-fns/locale'

import { Avatar, AvatarFallback } from '@/ui/shadcn/avatar'
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
import { Icon } from '@/ui/shared/widgets/components/icon'

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
import { LawyerSelectorDialog } from './lawyer-selector-dialog'

const CANAIS_VIRTUAIS = [
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { value: 'google-meet', label: 'Google Meet', icon: Video },
  { value: 'teams', label: 'Teams', icon: Monitor },
  { value: 'other', label: 'Outro', icon: MoreHorizontal },
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
    selectedLawyerDetails,
    selectedTime,
    virtualChannel,
    handleDateChange,
    handleDecisionChange,
    handleMeetingModeChange,
    handleLawyerChange,
    handleTimeChange,
    handleVirtualChannelChange,
  } = useDecisionStep()
  const [isLawyerDialogOpen, setIsLawyerDialogOpen] = useState(false)

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

  const advogadoDetalhes = selectedLawyerDetails

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
        <div className='rounded-2xl border border-border bg-card p-5 sm:p-7'>
          <div className='flex items-center gap-3'>
            <span className='flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary'>
              <CalendarDays className='size-5' />
            </span>
            <div className='min-w-0'>
              <h2 className='text-base font-semibold text-foreground'>
                Agendamento da consulta
              </h2>
              <p className='mt-0.5 text-xs text-muted-foreground'>
                Defina formato, responsável, data e horário.
              </p>
            </div>
          </div>

          <Separator className='my-6' />

          <div className='grid gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]'>
            <div className='flex flex-col gap-5'>
              <div className='flex flex-col gap-2'>
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
                      className={`flex h-11 items-center justify-center gap-2 rounded-lg border-2 px-3 text-xs font-medium transition-colors ${
                        meetingMode === value
                          ? 'border-primary bg-secondary text-primary'
                          : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:bg-secondary/50'
                      }`}
                    >
                      <Icon className='size-4' />
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

              {meetingMode === 'virtual' && (
                <div className='flex flex-col gap-2'>
                  <Label>
                    Canal da consulta <span className='text-destructive'>*</span>
                  </Label>
                  <div className='grid grid-cols-2 gap-2 sm:grid-cols-4'>
                    {CANAIS_VIRTUAIS.map(({ value, label, icon: Icon }) => (
                      <button
                        type='button'
                        key={value}
                        onClick={() => handleVirtualChannelChange(value)}
                        className={`flex h-11 items-center justify-center gap-1.5 rounded-lg border-2 px-2 text-xs transition-colors ${
                          virtualChannel === value
                            ? 'border-primary bg-secondary text-primary'
                            : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:bg-secondary/50'
                        }`}
                      >
                        <Icon className='size-3.5' />
                        <span className='truncate'>{label}</span>
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

              {meetingMode === 'in-person' && (
                <div className='flex flex-col gap-2'>
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

              <div className='flex flex-col gap-2'>
                <Label htmlFor='lawyer'>
                  Advogado <span className='text-destructive'>*</span>
                </Label>
                <button
                  id='lawyer'
                  type='button'
                  onClick={() => setIsLawyerDialogOpen(true)}
                  aria-haspopup='dialog'
                  className='flex h-11 w-full items-center justify-between gap-3 rounded-lg border-2 border-primary bg-card px-3.5 text-left text-sm text-foreground outline-none transition-colors hover:bg-secondary/40 focus-visible:ring-3 focus-visible:ring-ring/50'
                >
                  <span className='truncate'>
                    {advogadoDetalhes ? 'Alterar advogado' : 'Selecionar advogado'}
                  </span>
                  <Icon name='search' className='size-4 shrink-0 text-primary' />
                </button>
                {errors.lawyer && (
                  <span className='text-[12px] text-destructive'>
                    {errors.lawyer.message}
                  </span>
                )}
                {advogadoDetalhes && (
                  <div className='flex items-center gap-3 rounded-lg bg-secondary/70 p-3'>
                    <Avatar className='size-10 bg-primary text-primary-foreground'>
                      <AvatarFallback className='bg-primary text-xs font-semibold text-primary-foreground'>
                        {advogadoDetalhes.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className='min-w-0'>
                      <span className='block truncate text-sm font-semibold text-foreground'>
                        {advogadoDetalhes.label}
                      </span>
                      <span className='block text-xs text-muted-foreground'>
                        {advogadoDetalhes.area}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className='rounded-xl border border-border bg-card p-4 sm:p-5'>
              <Calendar
                mode='single'
                selected={selectedDate}
                defaultMonth={selectedDate}
                onSelect={handleDateChange}
                locale={ptBR}
                className='mx-auto w-full max-w-[380px] bg-transparent p-0 [--cell-size:2rem]'
              />

              <div className='mt-4 border-t border-border pt-4'>
                <div className='mb-3 text-sm font-semibold capitalize text-foreground'>
                  {selectedDate
                    ? selectedDate.toLocaleDateString('pt-BR', {
                        weekday: 'long',
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })
                    : 'Selecione uma data'}
                </div>

                <div className='grid grid-cols-2 gap-2'>
                  {HORARIOS.map((h) => (
                    <button
                      type='button'
                      key={h}
                      disabled={h === '14:00'}
                      onClick={() => handleTimeChange(h)}
                      className={`h-11 rounded-lg border text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                        selectedTime === h
                          ? 'border-primary bg-secondary font-semibold text-primary'
                          : 'border-border bg-card text-foreground hover:border-primary/50 hover:bg-secondary/40'
                      }`}
                    >
                      {h}
                    </button>
                  ))}
                </div>

                {errors.date && (
                  <span className='mt-2 block text-[12px] text-destructive'>
                    {errors.date.message}
                  </span>
                )}
                {errors.time && (
                  <span className='mt-2 block text-[12px] text-destructive'>
                    {errors.time.message}
                  </span>
                )}

                <div className='mt-4 flex items-center gap-1.5 text-[11px] text-muted-foreground'>
                  <Clock className='size-3.5 shrink-0 text-primary' />
                  <span>
                    Duração padrão: <strong>45 min</strong> · término calculado
                    automaticamente
                  </span>
                </div>
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

      <LawyerSelectorDialog
        open={isLawyerDialogOpen}
        onOpenChange={setIsLawyerDialogOpen}
        selectedLawyer={selectedLawyer}
        onSelect={handleLawyerChange}
      />
    </div>
  )
})

DecisionStep.displayName = 'DecisionStep'
