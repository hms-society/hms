import { ptBR } from 'date-fns/locale'
import { Controller } from 'react-hook-form'

import { Avatar, AvatarFallback } from '@/ui/shadcn/avatar'
import { Badge } from '@/ui/shadcn/badge'
import { Calendar } from '@/ui/shadcn/calendar'
import { Field, FieldError, FieldLabel } from '@/ui/shadcn/field'
import { Input } from '@/ui/shadcn/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/shadcn/select'
import { Textarea } from '@/ui/shadcn/textarea'
import { Icon, type IconName } from '@/ui/shared/widgets/components/icon'

import { useDecisionStep } from './use-decision-step'

const VIRTUAL_CHANNELS: Array<{ icon?: IconName; label: string; value: string }> = [
  { value: 'whatsapp', label: 'WhatsApp', icon: 'video' },
  { value: 'google-meet', label: 'Google Meet' },
  { value: 'teams', label: 'Teams' },
  { value: 'other', label: 'Outro' },
]

const LAWYERS = [
  { value: 'epaminondas', label: 'Adv. Epaminondas — Trabalhista' },
  { value: 'maria-silva', label: 'Adv. Maria Silva — Cível' },
]

const TIMES = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00']

const CLOSURE_REASONS = [
  { value: 'out_of_scope', label: 'Fora do escopo' },
  { value: 'legally_unviable', label: 'Inviável juridicamente' },
  { value: 'client_withdrew', label: 'Cliente desistiu' },
  { value: 'unable_to_contact', label: 'Sem contato' },
  { value: 'referred', label: 'Encaminhado' },
  { value: 'other', label: 'Outro' },
] as const

export const DecisionStep = () => {
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

  return (
    <div className='flex flex-col gap-5'>
      <div className='grid gap-3 sm:grid-cols-2'>
        <button
          type='button'
          aria-pressed={decision === 'schedule'}
          onClick={() => handleDecisionChange('schedule')}
          className={`flex min-h-28 flex-col items-center justify-center gap-1 rounded-xl border p-4 text-center outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 ${
            decision === 'schedule'
              ? 'border-primary bg-highlight text-primary'
              : 'border-border bg-card text-foreground hover:bg-secondary'
          }`}
        >
          <Icon name='calendar-check' className='size-5' />
          <span className='text-sm font-semibold'>Agendar consulta</span>
          <span className='text-xs font-normal'>
            Cria a consulta e o status Consulta agendada
          </span>
        </button>

        <button
          type='button'
          aria-pressed={decision === 'close'}
          onClick={() => handleDecisionChange('close')}
          className={`flex min-h-28 flex-col items-center justify-center gap-1 rounded-xl border p-4 text-center outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 ${
            decision === 'close'
              ? 'border-2 border-destructive bg-destructive/10 text-destructive'
              : 'border-border bg-card text-foreground hover:bg-secondary'
          }`}
        >
          <Icon name='door-open' className='size-5' />
          <span className='text-sm font-semibold'>Encerrar sem contratação</span>
          <span className='text-xs font-normal'>Exige o motivo do encerramento</span>
        </button>
      </div>

      {decision === 'schedule' ? (
        <div className='rounded-xl border border-border bg-card p-4 sm:p-6'>
          <div className='flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between'>
            <div className='flex items-center gap-3'>
              <span className='flex size-9 items-center justify-center rounded-lg bg-secondary text-primary'>
                <Icon name='calendar-clock' />
              </span>
              <div>
                <h2 className='font-sans text-sm font-semibold text-foreground'>
                  Agendamento da consulta
                </h2>
                <p className='text-xs text-muted-foreground'>
                  Defina formato, responsável, data e horário.
                </p>
              </div>
            </div>
            <p className='text-xs text-muted-foreground'>* Campos obrigatórios</p>
          </div>

          <div className='mt-5 grid gap-6 xl:grid-cols-2'>
            <div className='flex flex-col gap-4'>
              <Field data-invalid={Boolean(errors.meetingMode)}>
                <FieldLabel>Modalidade *</FieldLabel>
                <div className='grid grid-cols-2 gap-2'>
                  <button
                    type='button'
                    aria-pressed={meetingMode === 'virtual'}
                    onClick={() => handleMeetingModeChange('virtual')}
                    className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${
                      meetingMode === 'virtual'
                        ? 'border-2 border-primary bg-secondary text-primary'
                        : 'border-border text-muted-foreground'
                    }`}
                  >
                    <Icon name='video' />
                    Virtual — WhatsApp
                  </button>
                  <button
                    type='button'
                    aria-pressed={meetingMode === 'in-person'}
                    onClick={() => handleMeetingModeChange('in-person')}
                    className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${
                      meetingMode === 'in-person'
                        ? 'border-2 border-primary bg-secondary text-primary'
                        : 'border-border text-muted-foreground'
                    }`}
                  >
                    <Icon name='building' />
                    Presencial
                  </button>
                </div>
                <FieldError>{errors.meetingMode?.message}</FieldError>
              </Field>

              {meetingMode === 'virtual' ? (
                <Field data-invalid={Boolean(errors.virtualChannel)}>
                  <FieldLabel>Canal da consulta *</FieldLabel>
                  <div className='grid grid-cols-2 gap-2 sm:grid-cols-4'>
                    {VIRTUAL_CHANNELS.map((channel) => (
                      <button
                        key={channel.value}
                        type='button'
                        aria-pressed={virtualChannel === channel.value}
                        onClick={() => handleVirtualChannelChange(channel.value)}
                        className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${
                          virtualChannel === channel.value
                            ? 'border-2 border-primary bg-secondary font-semibold text-foreground'
                            : 'border-border text-muted-foreground'
                        }`}
                      >
                        {channel.icon && (
                          <Icon name={channel.icon} className='size-3.5' />
                        )}
                        {channel.label}
                      </button>
                    ))}
                  </div>
                  <FieldError>{errors.virtualChannel?.message}</FieldError>
                </Field>
              ) : (
                <Field data-invalid={Boolean(errors.location)}>
                  <FieldLabel htmlFor='location'>Local *</FieldLabel>
                  <Controller
                    name='location'
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id='location'
                        value={field.value ?? ''}
                        placeholder='Endereço ou sala de atendimento'
                        aria-invalid={Boolean(errors.location)}
                      />
                    )}
                  />
                  <FieldError>{errors.location?.message}</FieldError>
                </Field>
              )}

              <Field data-invalid={Boolean(errors.lawyer)}>
                <FieldLabel htmlFor='lawyer'>Advogado *</FieldLabel>
                <Controller
                  name='lawyer'
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger
                        id='lawyer'
                        className='w-full'
                        aria-invalid={Boolean(errors.lawyer)}
                      >
                        <SelectValue placeholder='Selecione um advogado' />
                      </SelectTrigger>
                      <SelectContent>
                        {LAWYERS.map((lawyer) => (
                          <SelectItem key={lawyer.value} value={lawyer.value}>
                            {lawyer.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError>{errors.lawyer?.message}</FieldError>
              </Field>

              {selectedLawyer && (
                <div className='flex flex-wrap items-center gap-3 rounded-lg bg-secondary p-3'>
                  <Avatar className='size-8'>
                    <AvatarFallback className='bg-brand text-xs text-brand-foreground'>
                      {selectedLawyer === 'epaminondas' ? 'EP' : 'MS'}
                    </AvatarFallback>
                  </Avatar>
                  <div className='min-w-0 flex-1'>
                    <p className='truncate text-xs font-medium text-foreground'>
                      {selectedLawyer === 'epaminondas'
                        ? 'Adv. Epaminondas'
                        : 'Adv. Maria Silva'}
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      {selectedLawyer === 'epaminondas' ? 'Trabalhista' : 'Cível'}
                    </p>
                  </div>
                  <Badge
                    variant='outline'
                    className='rounded-pill bg-card text-[10px] text-primary'
                  >
                    12 horários nos próximos 7 dias
                  </Badge>
                </div>
              )}
            </div>

            <div className='rounded-lg bg-secondary p-4'>
              <Calendar
                mode='single'
                selected={selectedDate}
                onSelect={handleDateChange}
                locale={ptBR}
                className='mx-auto w-full bg-transparent p-0'
              />
              <div className='mt-4 border-t border-border pt-4'>
                <p className='text-sm font-semibold text-foreground'>
                  {selectedDate
                    ? selectedDate.toLocaleDateString('pt-BR', {
                        weekday: 'long',
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })
                    : 'Selecione uma data'}
                </p>
                <div className='mt-3 grid grid-cols-2 gap-2'>
                  {TIMES.map((time) => (
                    <button
                      key={time}
                      type='button'
                      disabled={time === '14:00'}
                      aria-pressed={selectedTime === time}
                      onClick={() => handleTimeChange(time)}
                      className={`rounded-md border px-3 py-2 text-xs outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-40 ${
                        selectedTime === time
                          ? 'border-2 border-primary bg-card font-medium text-primary'
                          : 'border-border bg-card text-foreground'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
                <FieldError className='mt-2'>{errors.date?.message}</FieldError>
                <FieldError className='mt-2'>{errors.time?.message}</FieldError>
                <p className='mt-3 flex items-start gap-1.5 text-xs text-muted-foreground'>
                  <Icon name='info' className='mt-0.5 size-3 shrink-0' />
                  Duração padrão: 45 min · término calculado automaticamente
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className='rounded-xl border border-destructive bg-card p-4 sm:p-6'>
          <div className='flex items-center gap-2 border-b border-border pb-4 text-destructive'>
            <Icon name='triangle-alert' />
            <h2 className='font-sans text-sm font-medium'>Motivo do encerramento</h2>
          </div>

          <div className='mt-5 flex flex-col gap-5'>
            <Field data-invalid={Boolean(errors.closureReason)}>
              <FieldLabel htmlFor='closure-reason'>Motivo *</FieldLabel>
              <Controller
                name='closureReason'
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      id='closure-reason'
                      className='w-full'
                      aria-invalid={Boolean(errors.closureReason)}
                    >
                      <SelectValue placeholder='Selecione' />
                    </SelectTrigger>
                    <SelectContent>
                      {CLOSURE_REASONS.map((reason) => (
                        <SelectItem key={reason.value} value={reason.value}>
                          {reason.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <div className='flex flex-wrap gap-1.5 pt-1'>
                {CLOSURE_REASONS.map((reason) => (
                  <button
                    key={reason.value}
                    type='button'
                    onClick={() => handleClosureReasonChange(reason.value)}
                    className='rounded-pill border border-border px-2.5 py-1 text-[10px] text-muted-foreground outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50'
                  >
                    {reason.label}
                  </button>
                ))}
              </div>
              <FieldError>{errors.closureReason?.message}</FieldError>
            </Field>

            <Field data-invalid={Boolean(errors.closureNotes)}>
              <FieldLabel htmlFor='closure-notes'>Observações (opcional)</FieldLabel>
              <Controller
                name='closureNotes'
                control={control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    id='closure-notes'
                    value={field.value ?? ''}
                    className='min-h-24 resize-y'
                    placeholder='Detalhes sobre o encerramento'
                    aria-invalid={Boolean(errors.closureNotes)}
                  />
                )}
              />
              <FieldError>{errors.closureNotes?.message}</FieldError>
            </Field>

            <p className='flex items-start gap-2 rounded-lg bg-secondary px-3 py-2 text-xs text-secondary-foreground'>
              <Icon name='info' className='mt-0.5 size-3.5 shrink-0 text-primary' />O
              cadastro da pessoa é preservado para futuros intakes
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
