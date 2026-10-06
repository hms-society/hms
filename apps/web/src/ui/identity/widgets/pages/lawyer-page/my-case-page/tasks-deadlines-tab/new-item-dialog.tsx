import { useEffect, useState } from 'react'
import { ptBR } from 'date-fns/locale'

import { Icon } from '@/ui/shared/widgets/components/icon'
import { Button } from '@/ui/shadcn/button'
import { Calendar } from '@/ui/shadcn/calendar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/shadcn/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/ui/shadcn/popover'

import type { CreateTaskDeadlineInput, TaskDeadlineItem, TaskDeadlineType } from './types'

const TYPES: Array<
  [
    TaskDeadlineType,
    'calendar-clock' | 'calendar-check' | 'file-text' | 'list-checks' | 'send' | 'circle',
  ]
> = [
  ['Prazo processual', 'calendar-clock'],
  ['Audiência', 'calendar-check'],
  ['Publicação', 'file-text'],
  ['Tarefa interna', 'list-checks'],
  ['Entrega', 'send'],
  ['Outro', 'circle'],
]

export function NewItemDialog({
  open,
  onOpenChange,
  onCreate,
  editingItem,
  onUpdate,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (input: CreateTaskDeadlineInput) => void
  editingItem?: TaskDeadlineItem
  onUpdate?: (item: TaskDeadlineItem) => void
}) {
  const [type, setType] = useState<TaskDeadlineType>('Publicação')
  const [description, setDescription] = useState('')
  const [plannedDate, setPlannedDate] = useState('')
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [plannedTime, setPlannedTime] = useState('')
  const [customType, setCustomType] = useState('')
  const [alerts, setAlerts] = useState<string[]>([])
  const [error, setError] = useState('')
  const [status, setStatus] = useState('A fazer')
  useEffect(() => {
    if (!open) return
    setType(editingItem?.type ?? 'Publicação')
    setDescription(editingItem?.description ?? '')
    setPlannedDate(editingItem?.plannedDate ?? '')
    setPlannedTime(editingItem?.plannedTime ?? '')
    setStatus(editingItem?.status ?? 'A fazer')
    setCustomType(editingItem?.customType ?? '')
    setAlerts(editingItem?.alerts ?? [])
    setSelectedDate(
      editingItem?.plannedDate
        ? new Date(`${editingItem.plannedDate}T12:00:00`)
        : undefined,
    )
  }, [editingItem, open])
  const submit = () => {
    if (!description.trim() || !plannedDate || (type === 'Outro' && !customType.trim())) {
      setError('Preencha os campos obrigatórios para continuar.')
      return
    }
    const input = {
      type,
      description: description.trim(),
      plannedDate,
      plannedTime,
      people: ['Dr. Ricardo Mendes'],
      alerts,
      customType: customType.trim() || undefined,
    }
    if (editingItem && onUpdate) onUpdate({ ...editingItem, ...input, status })
    else onCreate(input)
    setDescription('')
    setPlannedDate('')
    setSelectedDate(undefined)
    setPlannedTime('')
    setCustomType('')
    setAlerts([])
    setError('')
    onOpenChange(false)
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[calc(100dvh-2rem)] gap-0 overflow-x-hidden overflow-y-auto rounded-2xl p-0 sm:max-w-[620px]'>
        <DialogHeader className='border-b border-border px-6 py-5 pr-14'>
          <p className='text-[10px] font-semibold uppercase tracking-widest text-muted-foreground'>
            CASO CASO-20260703-0089 · APOSENTADORIA POR TC
          </p>
          <DialogTitle className='font-serif text-2xl font-semibold'>
            {editingItem ? 'Editar tarefa ou prazo' : 'Nova tarefa ou prazo'}
          </DialogTitle>
          <DialogDescription>
            O tipo escolhido define o tratamento do item, os alertas e o bloqueio de
            encerramento.
          </DialogDescription>
        </DialogHeader>
        <div className='flex flex-col gap-5 px-6 py-5'>
          {editingItem && (
            <div className='rounded-xl border border-border bg-muted/20 p-3'>
              <div className='mb-2 flex items-center justify-between'>
                <span className='text-sm font-semibold'>Status</span>
                <span className='text-xs text-muted-foreground'>
                  Atualize o andamento
                </span>
              </div>
              <div className='grid grid-cols-2 gap-2 sm:grid-cols-4'>
                {['A fazer', 'Em andamento', 'Concluída'].map((option) => (
                  <Button
                    key={option}
                    type='button'
                    variant='outline'
                    onClick={() => setStatus(option)}
                    className={`h-9 rounded-full px-3 text-xs ${status === option ? 'border-primary bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground' : 'bg-background text-muted-foreground'}`}
                  >
                    {status === option && <Icon name='check' className='size-3.5' />}
                    {option}
                  </Button>
                ))}
              </div>
            </div>
          )}
          <div>
            <p className='mb-2 text-sm font-semibold'>
              Tipo <span className='text-destructive'>*</span>
            </p>
            <div className='grid grid-cols-2 gap-2 sm:grid-cols-3'>
              {TYPES.map(([label, icon]) => (
                <Button
                  key={label}
                  type='button'
                  variant='outline'
                  onClick={() => setType(label)}
                  className={`h-14 justify-start gap-2 rounded-lg text-left ${type === label ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary' : ''}`}
                >
                  <Icon name={icon} className='size-4' />
                  <span className='text-xs'>{label}</span>
                  {type === label && (
                    <Icon name='check-circle-2' className='ml-auto size-4' />
                  )}
                </Button>
              ))}
            </div>
          </div>
          {type === 'Outro' && (
            <div className='flex flex-col gap-2 text-sm font-semibold'>
              <span>
                Nome do tipo <span className='text-destructive'>*</span>
              </span>
              <input
                aria-label='Nome do tipo'
                value={customType}
                onChange={(event) => {
                  setCustomType(event.target.value)
                  setError('')
                }}
                placeholder='Informe o tipo do item'
                className='h-10 rounded-lg border border-border bg-background px-3 text-sm font-normal placeholder:text-muted-foreground/55'
              />
            </div>
          )}
          <label className='flex flex-col gap-2 text-sm font-semibold'>
            <span>
              Descrição <span className='text-destructive'>*</span>
            </span>
            <textarea
              aria-label='Descrição'
              placeholder='Insira uma breve descrição da nova tarefa ou prazo'
              value={description}
              onChange={(event) => {
                setDescription(event.target.value)
                setError('')
              }}
              className='min-h-20 rounded-lg border border-border bg-background p-3 text-sm font-normal placeholder:text-muted-foreground/55'
            />
            {error && !description.trim() && (
              <span className='text-xs font-normal text-destructive'>{error}</span>
            )}
          </label>
          <div className='grid gap-3 sm:grid-cols-2'>
            <div className='flex flex-col gap-2 text-sm font-semibold'>
              <span>
                Data prevista <span className='text-destructive'>*</span>
              </span>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type='button'
                    variant='outline'
                    aria-label='Data prevista'
                    className='h-10 w-full justify-start rounded-xl bg-background font-normal'
                  >
                    <Icon name='calendar' className='mr-2 size-4 text-muted-foreground' />
                    {selectedDate
                      ? selectedDate.toLocaleDateString('pt-BR')
                      : 'Selecione a data prevista'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-0' align='start'>
                  <Calendar
                    mode='single'
                    selected={selectedDate}
                    onSelect={(date) => {
                      setSelectedDate(date)
                      setPlannedDate(date ? date.toISOString().slice(0, 10) : '')
                      setError('')
                      setIsCalendarOpen(false)
                    }}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
              {error && !plannedDate && (
                <span className='text-xs font-normal text-destructive'>{error}</span>
              )}
            </div>
            <label className='flex flex-col gap-2 text-sm font-semibold'>
              <span>
                Hora limite{' '}
                <span className='text-xs font-normal text-muted-foreground'>
                  opcional
                </span>
              </span>
              <input
                aria-label='Hora limite'
                type='time'
                value={plannedTime}
                onChange={(event) => setPlannedTime(event.target.value)}
                className='h-10 rounded-lg border border-border bg-background px-3 text-sm font-normal'
              />
            </label>
          </div>
          <div>
            <p className='text-sm font-semibold'>Responsáveis</p>
            <p className='mt-1 text-xs text-muted-foreground'>
              Uma ou mais pessoas da equipe do caso serão notificadas.
            </p>
            <div className='mt-2 rounded-lg border border-border px-3 py-2 text-sm'>
              <span className='rounded-full bg-primary/10 px-3 py-1 text-primary'>
                RM · Dr. Ricardo Mendes
              </span>
              <Button
                type='button'
                variant='outline'
                size='xs'
                className='mt-2 rounded-full'
              >
                + Adicionar
              </Button>
            </div>
          </div>
          <div>
            <p className='text-sm font-semibold'>Alertas antecipados</p>
            <p className='mt-1 text-xs text-muted-foreground'>
              Configure lembretes antes da data prevista.
            </p>
            <div className='mt-2 grid grid-cols-3 gap-2'>
              {['7 dias antes', '3 dias antes', '1 dia antes'].map((alert) => (
                <label
                  key={alert}
                  className='flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground'
                >
                  <input
                    type='checkbox'
                    checked={alerts.includes(alert)}
                    onChange={(event) =>
                      setAlerts((current) =>
                        event.target.checked
                          ? [...current, alert]
                          : current.filter((value) => value !== alert),
                      )
                    }
                  />
                  {alert}
                </label>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter className='px-6 py-4'>
          <Button variant='ghost' onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button className='rounded-full' onClick={submit}>
            <Icon name={editingItem ? 'pencil' : 'plus'} className='size-3.5' />
            {editingItem
              ? 'Salvar alterações'
              : `Criar ${type === 'Publicação' ? 'monitoramento' : 'item'}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
