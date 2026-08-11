import { forwardRef, useImperativeHandle } from 'react'
import { useFormContext, Controller } from 'react-hook-form'
import { Badge } from '@/ui/shadcn/badge'
import { Avatar, AvatarFallback } from '@/ui/shadcn/avatar'
import { Label } from '@/ui/shadcn/label'
import { Input } from '@/ui/shadcn/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/shadcn/select'
import { Separator } from '@/ui/shadcn/separator'
import { Calendar } from '@/ui/shadcn/calendar'
import { Textarea } from '@/ui/shadcn/textarea'
import {
  CalendarDays,
  MapPin,
  MessageCircle,
  Video,
  Monitor,
  MoreHorizontal,
  Clock,
  DoorOpen,
  AlertTriangle,
  Info,
} from 'lucide-react'
import { ptBR } from 'date-fns/locale'
import type { IntakeFullData } from './schemas/intake-schema'
import type { StepRef } from './step-demand'

const canais = [
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { value: 'google-meet', label: 'Google Meet', icon: Video },
  { value: 'teams', label: 'Teams', icon: Monitor },
  { value: 'outro', label: 'Outro', icon: MoreHorizontal },
]

const advogados = [
  {
    value: 'epaminondas',
    label: 'Adv. Epaminondas — Trabalhista',
    nome: 'Adv. Epaminondas',
    especialidade: 'Trabalhista',
    iniciais: 'EP',
    horarios: 12,
  },
  {
    value: 'maria',
    label: 'Adv. Maria Silva — Civil',
    nome: 'Adv. Maria Silva',
    especialidade: 'Civil',
    iniciais: 'MS',
    horarios: 8,
  },
]

const horarios = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00']

const motivosEncerramento = [
  { value: 'fora-do-escopo', label: 'Fora do escopo' },
  { value: 'inviavel-juridicamente', label: 'Inviável juridicamente' },
  { value: 'cliente-desistiu', label: 'Cliente desistiu' },
  { value: 'sem-contato', label: 'Sem contato' },
  { value: 'encaminhado', label: 'Encaminhado' },
  { value: 'outro', label: 'Outro' },
]

interface StepDecisionProps {
  tipoCard: 'agendar' | 'registrar'
  setTipoCard: (v: 'agendar' | 'registrar') => void
}

export const StepDecision = forwardRef<StepRef, StepDecisionProps>(
  ({ tipoCard, setTipoCard }, ref) => {
    const { control, trigger, watch, setValue, formState } =
      useFormContext<IntakeFullData>()
    const errors = formState.errors as Record<string, any>
    const modalidade = watch('modalidade')
    const canalVirtual = watch('canalVirtual')
    const advogadoSelecionado = watch('advogado')
    const selectedDate = watch('data')
    const selectedHorario = watch('horario')

    useImperativeHandle(ref, () => ({
      validate: async () => {
        if (tipoCard === 'agendar') {
          const fields = ['modalidade', 'advogado', 'data', 'horario']
          if (modalidade === 'virtual') fields.push('canalVirtual')
          if (modalidade === 'presencial') fields.push('local')
          return await trigger(fields as any)
        } else {
          return await trigger(['motivo'] as any)
        }
      },
    }))

    const advogado = advogados.find((a) => a.value === advogadoSelecionado)

    const handleMudarTipoCard = (novoTipo: 'agendar' | 'registrar') => {
      setTipoCard(novoTipo)
      setValue('tipoCard', novoTipo, { shouldValidate: true })
    }

    return (
      <div className='flex flex-col gap-5'>
        <div className='grid grid-cols-2 gap-4'>
          <button
            type='button'
            onClick={() => handleMudarTipoCard('agendar')}
            className={`flex flex-col items-center gap-1 py-4 rounded-xl border-2 transition-colors ${
              tipoCard === 'agendar'
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-border bg-card text-muted-foreground'
            }`}
          >
            <CalendarDays className='w-5 h-5' />
            <span className='text-[13px] font-serif'>Agendar consulta</span>
          </button>
          <button
            type='button'
            onClick={() => handleMudarTipoCard('registrar')}
            className={`flex flex-col items-center gap-1 py-4 rounded-xl border-2 transition-colors ${
              tipoCard === 'registrar'
                ? 'border-destructive bg-destructive/5 text-destructive'
                : 'border-border bg-card text-muted-foreground'
            }`}
          >
            <DoorOpen className='w-5 h-5' />
            <span className='text-[13px] font-serif'>Encerrar atendimento</span>
          </button>
        </div>

        <Separator />

        {tipoCard === 'agendar' && (
          <div className='flex flex-col gap-5'>
            <div className='flex items-center gap-2'>
              <CalendarDays className='w-4 h-4 text-primary' />
              <span className='text-[14px] font-serif text-foreground'>
                Dados do agendamento
              </span>
            </div>

            <div className='flex flex-col gap-1.5'>
              <Label>
                Modalidade <span className='text-destructive'>*</span>
              </Label>
              <div className='grid grid-cols-2 gap-2'>
                {[
                  { value: 'virtual', label: 'Virtual — WhatsApp', icon: Monitor },
                  { value: 'presencial', label: 'Presencial', icon: MapPin },
                ].map(({ value, label, icon: Icon }) => (
                  <button
                    type='button'
                    key={value}
                    onClick={() =>
                      setValue('modalidade', value as 'virtual' | 'presencial', {
                        shouldValidate: true,
                      })
                    }
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 text-[13px] font-medium transition-colors ${
                      modalidade === value
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-card text-muted-foreground'
                    }`}
                  >
                    <Icon className='w-4 h-4' />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {modalidade === 'virtual' && (
              <div className='flex flex-col gap-1.5'>
                <Label>
                  Canal (Virtual) <span className='text-destructive'>*</span>
                </Label>
                <div className='grid grid-cols-4 gap-2'>
                  {canais.map(({ value, label, icon: Icon }) => (
                    <button
                      type='button'
                      key={value}
                      onClick={() =>
                        setValue('canalVirtual', value, { shouldValidate: true })
                      }
                      className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-lg border-2 text-[12px] transition-colors ${
                        canalVirtual === value
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border text-muted-foreground'
                      }`}
                    >
                      <Icon className='w-4 h-4' />
                      {label}
                    </button>
                  ))}
                </div>
                {errors.canalVirtual && (
                  <span className='text-[12px] text-destructive'>
                    {errors.canalVirtual.message}
                  </span>
                )}
              </div>
            )}

            {modalidade === 'presencial' && (
              <div className='flex flex-col gap-1.5'>
                <Label>
                  Local <span className='text-destructive'>*</span>
                </Label>
                <Controller
                  name='local'
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      value={field.value ?? ''}
                      placeholder='Endereço ou sala de atendimento'
                    />
                  )}
                />
                {errors.local && (
                  <span className='text-[12px] text-destructive'>
                    {errors.local.message}
                  </span>
                )}
              </div>
            )}

            <div className='flex flex-col gap-2'>
              <Label>
                Advogado <span className='text-destructive'>*</span>
              </Label>
              <Controller
                name='advogado'
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={(v) => field.onChange(v)}
                    value={field.value ?? ''}
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder='Selecione um advogado...' />
                    </SelectTrigger>
                    <SelectContent>
                      {advogados.map((a) => (
                        <SelectItem key={a.value} value={a.value}>
                          {a.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.advogado && (
                <span className='text-[12px] text-destructive'>
                  {errors.advogado.message}
                </span>
              )}

              {advogado && (
                <div className='flex items-center gap-3 bg-muted/40 border border-border rounded-xl p-3'>
                  <Avatar>
                    <AvatarFallback className='bg-primary/15 text-primary text-[12px] font-bold'>
                      {advogado.iniciais}
                    </AvatarFallback>
                  </Avatar>
                  <div className='flex flex-col'>
                    <span className='text-[13px] text-foreground'>{advogado.nome}</span>
                    <span className='text-[11px] text-muted-foreground'>
                      {advogado.especialidade}
                    </span>
                  </div>
                  <Badge
                    variant='outline'
                    className='ml-auto text-primary border-primary/20 bg-primary/5 rounded-pill'
                  >
                    <Clock className='w-3 h-3' />
                    {advogado.horarios} horários nos próximos 7 dias
                  </Badge>
                </div>
              )}
            </div>

            <Separator />

            <div className='grid grid-cols-[1.5fr_2fr] gap-6'>
              <Calendar
                mode='single'
                selected={selectedDate ? new Date(selectedDate) : undefined}
                onSelect={(date) => {
                  if (date) setValue('data', date, { shouldValidate: true })
                }}
                locale={ptBR}
                className='rounded-xl border border-border p-3'
                classNames={{ root: 'w-[85%]' }}
              />
              <div className='flex flex-col gap-3'>
                <span className='text-[13px] text-foreground'>
                  {selectedDate
                    ? new Date(selectedDate).toLocaleDateString('pt-BR', {
                        weekday: 'long',
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })
                    : 'Selecione uma data'}
                </span>
                <div className='grid grid-cols-2 gap-2'>
                  {horarios.map((h) => (
                    <button
                      type='button'
                      key={h}
                      onClick={() => setValue('horario', h, { shouldValidate: true })}
                      className={`py-2 rounded-lg border text-[13px] transition-colors ${
                        selectedHorario === h
                          ? 'border-primary bg-primary/5 text-primary font-medium'
                          : 'border-border text-foreground hover:border-primary/50'
                      }`}
                    >
                      {h}
                    </button>
                  ))}
                </div>
                {errors.horario && (
                  <span className='text-[12px] text-destructive'>
                    {errors.horario.message}
                  </span>
                )}
                <span className='flex items-center gap-1.5 text-[11px] text-muted-foreground'>
                  <Clock className='w-3 h-3' />
                  Duração padrão: 45 min · término calculado automaticamente
                </span>
              </div>
            </div>
          </div>
        )}

        {tipoCard === 'registrar' && (
          <div className='flex flex-col gap-4'>
            <div className='flex flex-col gap-4 border border-destructive/30 bg-card rounded-xl p-4'>
              <div className='flex items-center gap-2 text-destructive'>
                <AlertTriangle className='w-4 h-4' />
                <span className='text-[14px] font-serif'>Motivo do encerramento</span>
              </div>
              <div className='flex flex-col gap-1.5'>
                <Label>
                  Motivo <span className='text-destructive'>*</span>
                </Label>
                <Controller
                  name='motivo'
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value ?? ''}>
                      <SelectTrigger className='w-full'>
                        <SelectValue placeholder='Selecione...' />
                      </SelectTrigger>
                      <SelectContent>
                        {motivosEncerramento.map((m) => (
                          <SelectItem key={m.value} value={m.value}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.motivo && (
                  <span className='text-[12px] text-destructive'>
                    {errors.motivo.message}
                  </span>
                )}
              </div>
              <div className='flex flex-col gap-1.5'>
                <Label>
                  Observações{' '}
                  <span className='text-muted-foreground font-normal'>(opcional)</span>
                </Label>
                <Controller
                  name='observacoesEncerramento'
                  control={control}
                  render={({ field }) => (
                    <Textarea
                      {...field}
                      value={field.value ?? ''}
                      placeholder='Detalhes sobre o encerramento...'
                      className='resize-none min-h-[90px]'
                    />
                  )}
                />
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
  },
)

StepDecision.displayName = 'StepDecision'
