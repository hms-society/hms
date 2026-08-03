import { useState } from 'react'
import { Timer, CalendarDays, Plus, Trash2, Loader2, X } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { Button } from '@/ui/shadcn/button'
import { Switch } from '@/ui/shadcn/switch'
import { Input } from '@/ui/shadcn/input'
import { Label } from '@/ui/shadcn/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/ui/shadcn/dialog'
import type { BlockedPeriod } from '@hms/core/scheduling/domain/entities'
import { useConsultation } from './use-consultation'

const DEFAULT_WEEKLY_AVAILABILITY = [
  { id: 'monday', name: 'Segunda-feira', active: true, slots: [] },
  { id: 'tuesday', name: 'Terça-feira', active: true, slots: [] },
  { id: 'wednesday', name: 'Quarta-feira', active: true, slots: [] },
  { id: 'thursday', name: 'Quinta-feira', active: true, slots: [] },
  { id: 'friday', name: 'Sexta-feira', active: true, slots: [] },
  { id: 'saturday', name: 'Sábado', active: false, slots: [] },
  { id: 'sunday', name: 'Domingo', active: false, slots: [] },
]

function formatBlockedDateRange(startsOn: string, endsOn?: string) {
  if (!startsOn) return ''

  const [startYear, startMonth, startDay] = startsOn.split('-').map(Number)
  const start = new Date(startYear, startMonth - 1, startDay)

  if (!endsOn || startsOn === endsOn) {
    return format(start, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
  }

  const [endYear, endMonth, endDay] = endsOn.split('-').map(Number)
  const end = new Date(endYear, endMonth - 1, endDay)

  const isSameMonth =
    start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()

  if (isSameMonth) {
    return `${format(start, 'dd')} até ${format(end, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`
  }

  return `${format(start, "dd 'de' MMM", { locale: ptBR })} a ${format(end, "dd 'de' MMM 'de' yyyy", { locale: ptBR })}`
}

export const Consultation = () => {
  const {
    schedule,
    isLoading,
    updateDuration,
    isUpdatingDuration,
    updateAvailability,
    isUpdatingAvailability,
    addBlock,
    isAddingBlock,
    removeBlock,
    isRemovingBlock,
  } = useConsultation()

  const [modalOpen, setModalOpen] = useState(false)
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null)
  const [startTime, setStartTime] = useState('08:00')
  const [endTime, setEndTime] = useState('12:00')

  const [modalBlockOpen, setModalBlockOpen] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [blockReason, setBlockReason] = useState('')

  const rawAvailability =
    (schedule as any)?.weeklyAvailability ?? (schedule as any)?.availability ?? []
  const weeklyAvailability =
    rawAvailability.length > 0 ? rawAvailability : DEFAULT_WEEKLY_AVAILABILITY
  const blockedPeriods: BlockedPeriod[] = schedule?.blockedPeriods ?? []

  const currentDuration =
    schedule?.appointmentDurationInMinutes ??
    (schedule as any)?.defaultDurationMinutes ??
    45

  const handleToggleDay = async (dayId: string, currentActive: boolean) => {
    const updated = weeklyAvailability.map((day: any) =>
      day.id === dayId ? { ...day, active: !currentActive } : day,
    )

    try {
      await updateAvailability(updated)
    } catch (error) {
      console.error('Erro ao atualizar dia:', error)
    }
  }

  const handleOpenAddModal = (dayId: string) => {
    setSelectedDayId(dayId)
    setStartTime('08:00')
    setEndTime('12:00')
    setModalOpen(true)
  }

  const handleAddSlot = async () => {
    if (!selectedDayId) return

    const updated = weeklyAvailability.map((day: any) => {
      if (day.id === selectedDayId) {
        const currentSlots = day.slots ?? []
        return {
          ...day,
          active: true,
          slots: [...currentSlots, { start: startTime, end: endTime }],
        }
      }
      return day
    })

    try {
      await updateAvailability(updated)
      setModalOpen(false)
    } catch (error) {
      console.error('Erro ao adicionar intervalo:', error)
    }
  }

  const handleRemoveSlot = async (dayId: string, slotIndex: number) => {
    const updated = weeklyAvailability.map((day: any) => {
      if (day.id === dayId) {
        const newSlots = (day.slots ?? []).filter(
          (_: any, idx: number) => idx !== slotIndex,
        )
        return {
          ...day,
          slots: newSlots,
        }
      }
      return day
    })

    try {
      await updateAvailability(updated)
    } catch (error) {
      console.error('Erro ao remover intervalo:', error)
    }
  }

  const handleOpenAddBlockModal = () => {
    setStartDate('')
    setEndDate('')
    setBlockReason('')
    setModalBlockOpen(true)
  }

  const handleAddBlock = async () => {
    if (!startDate) return
    try {
      await addBlock({
        startDate,
        endDate: endDate || startDate,
        reason: blockReason.trim() || 'Bloqueio de agenda',
      })
      setModalBlockOpen(false)
      setStartDate('')
      setEndDate('')
      setBlockReason('')
    } catch (error) {
      console.error('Erro ao adicionar bloqueio:', error)
    }
  }

  const handleRemoveBlock = async (blockId: string) => {
    try {
      await removeBlock(blockId)
    } catch (error) {
      console.error('Erro ao remover bloqueio:', error)
    }
  }

  if (isLoading) {
    return (
      <div className='flex h-64 w-full items-center justify-center'>
        <Loader2 className='size-6 animate-spin text-primary' />
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-6 max-w-5xl pt-20 md:pt-24 px-4 sm:px-6 w-full mx-auto pb-10'>
      <div className='flex flex-col gap-1'>
        <h1 className='text-ring font-serif text-[20px] sm:text-[24px] font-semibold'>
          Configurar agenda
        </h1>
        <p className='text-muted-foreground font-sans text-[13px] sm:text-[14px]'>
          Defina sua disponibilidade semanal, duração de consulta e bloqueios
        </p>
      </div>

      <div className='bg-card border border-border rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
        <div className='flex items-center gap-3'>
          <Timer className='w-5 h-5 text-primary shrink-0' />
          <div className='flex flex-col'>
            <span className='text-[14px] font-semibold text-foreground'>
              Duração padrão da consulta
            </span>
            <span className='text-[12px] text-muted-foreground'>
              Tempo reservado para cada agendamento
            </span>
          </div>
        </div>

        <div className='flex items-center gap-2 w-full sm:w-auto justify-start sm:justify-end overflow-x-auto pb-1 sm:pb-0'>
          {(
            [
              { minutes: 30, label: '30 min' },
              { minutes: 45, label: '45 min' },
              { minutes: 60, label: '1 hora' },
            ] as const
          ).map((item) => {
            const isSelected = currentDuration === item.minutes

            return (
              <Button
                key={item.minutes}
                variant={isSelected ? 'default' : 'outline'}
                disabled={isUpdatingDuration}
                className='rounded-full px-4 flex-1 sm:flex-initial'
                onClick={async () => {
                  try {
                    await updateDuration(item.minutes)
                  } catch (err) {
                    console.error('Erro ao atualizar duração:', err)
                  }
                }}
              >
                {item.label}
              </Button>
            )
          })}
        </div>
      </div>
      <div className='bg-card border border-border rounded-xl p-4 sm:p-5 flex flex-col gap-5'>
        <div className='flex items-center gap-2 pb-3 border-b border-border'>
          <CalendarDays className='w-5 h-5 text-primary shrink-0' />
          <span className='text-[15px] font-semibold text-foreground'>
            Disponibilidade semanal
          </span>
        </div>

        <div className='flex flex-col divide-y divide-border/40'>
          {weeklyAvailability.map(
            (day: {
              id: string
              name: string
              active: boolean
              slots?: { start: string; end: string }[]
            }) => (
              <div
                key={day.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 py-3.5 px-2 rounded-lg transition-colors ${
                  !day.active ? 'opacity-60 bg-muted/20' : ''
                }`}
              >
                <div className='flex items-center gap-3 min-w-[160px]'>
                  <Switch
                    checked={day.active}
                    disabled={isUpdatingAvailability}
                    onCheckedChange={() => handleToggleDay(day.id, day.active)}
                  />

                  <span className='text-[14px] font-medium text-foreground shrink-0'>
                    {day.name}
                  </span>
                </div>
                <div className='flex items-center justify-between sm:justify-end gap-3 flex-1 w-full sm:w-auto pl-11 sm:pl-0'>
                  {day.active ? (
                    <div className='flex items-center gap-2 flex-wrap flex-1 sm:justify-start'>
                      {day.slots?.map((slot, idx) => (
                        <div
                          key={idx}
                          className='flex items-center gap-1.5 bg-muted/50 border border-border px-2.5 py-1 rounded-lg text-[13px] text-foreground group'
                        >
                          <span>{slot.start}</span>
                          <span className='text-muted-foreground'>—</span>
                          <span>{slot.end}</span>

                          <button
                            type='button'
                            disabled={isUpdatingAvailability}
                            onClick={() => handleRemoveSlot(day.id, idx)}
                            className='ml-1 text-muted-foreground hover:text-destructive opacity-70 group-hover:opacity-100 transition-opacity'
                          >
                            <X className='size-3.5' />
                          </button>
                        </div>
                      ))}

                      <Button
                        variant='outline'
                        size='icon'
                        disabled={isUpdatingAvailability}
                        className='size-7 rounded-lg text-primary shrink-0'
                        onClick={() => handleOpenAddModal(day.id)}
                      >
                        <Plus className='size-4' />
                      </Button>
                    </div>
                  ) : (
                    <span className='text-[13px] text-muted-foreground italic'>
                      Indisponível
                    </span>
                  )}
                </div>
              </div>
            ),
          )}
        </div>
      </div>
      <div className='bg-card border border-border rounded-xl p-4 sm:p-5 flex flex-col gap-5'>
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border'>
          <div className='flex items-center gap-2'>
            <CalendarDays className='w-5 h-5 text-primary shrink-0' />
            <span className='text-[15px] font-semibold text-foreground'>
              Bloqueios de agenda
            </span>
          </div>

          <Button
            onClick={handleOpenAddBlockModal}
            className='rounded-full px-4 gap-1.5 w-full sm:w-auto justify-center'
          >
            <Plus className='size-4' />
            Adicionar bloqueio
          </Button>
        </div>

        <div className='flex flex-col gap-3'>
          {blockedPeriods.length > 0 ? (
            blockedPeriods.map((block: BlockedPeriod) => (
              <div
                key={block.id}
                className='flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors border border-border/50 gap-3'
              >
                <div className='flex items-start gap-3 min-w-0'>
                  <span className='w-2 h-2 rounded-full border-2 border-primary shrink-0 mt-1.5' />
                  <div className='flex flex-col truncate'>
                    <span className='text-[13px] sm:text-[14px] font-semibold text-foreground truncate'>
                      {formatBlockedDateRange(block.startsOn, block.endsOn)}
                    </span>
                    <span className='text-[12px] text-muted-foreground truncate'>
                      {block.reason || 'Sem descrição'}
                    </span>
                  </div>
                </div>

                <Button
                  variant='ghost'
                  size='icon'
                  disabled={isRemovingBlock}
                  className='size-8 text-muted-foreground hover:text-destructive shrink-0'
                  onClick={() => handleRemoveBlock(block.id)}
                >
                  <Trash2 className='size-4' />
                </Button>
              </div>
            ))
          ) : (
            <p className='text-xs text-muted-foreground italic py-2'>
              Nenhum bloqueio cadastrado para esta agenda.
            </p>
          )}
        </div>
      </div>
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className='sm:max-w-[420px] rounded-2xl p-4 sm:p-6 w-[92vw] sm:w-full'>
          <DialogHeader className='pb-4 border-b border-border'>
            <DialogTitle className='font-serif text-[18px] text-foreground'>
              Adicionar intervalo
            </DialogTitle>
          </DialogHeader>

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 py-4'>
            <div className='flex flex-col gap-2'>
              <Label className='text-[13px] text-foreground'>Horário inicial</Label>
              <Input
                type='time'
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>

            <div className='flex flex-col gap-2'>
              <Label className='text-[13px] text-foreground'>Horário final</Label>
              <Input
                type='time'
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className='pt-4 border-t border-border flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3'>
            <Button
              type='button'
              variant='brand'
              onClick={() => setModalOpen(false)}
              disabled={isUpdatingAvailability}
              className='rounded-full px-5'
            >
              Cancelar
            </Button>
            <Button
              type='button'
              onClick={handleAddSlot}
              disabled={isUpdatingAvailability}
              className='rounded-full px-5 gap-1.5'
            >
              {isUpdatingAvailability ? (
                <>
                  <Loader2 className='size-4 animate-spin' />
                  Salvando...
                </>
              ) : (
                'Adicionar intervalo'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={modalBlockOpen} onOpenChange={setModalBlockOpen}>
        <DialogContent className='sm:max-w-[420px] rounded-2xl p-4 sm:p-6 w-[92vw] sm:w-full'>
          <DialogHeader className='pb-4 border-b border-border'>
            <DialogTitle className='font-serif text-[18px] text-foreground'>
              Adicionar bloqueio
            </DialogTitle>
          </DialogHeader>

          <div className='flex flex-col gap-4 py-4'>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div className='flex flex-col gap-2'>
                <Label className='text-[13px] text-foreground'>Data inicial</Label>
                <Input
                  type='date'
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className='flex flex-col gap-2'>
                <Label className='text-[13px] text-foreground'>Data final</Label>
                <Input
                  type='date'
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className='flex flex-col gap-2'>
              <Label className='text-[13px] text-foreground'>
                Motivo{' '}
                <span className='text-muted-foreground font-normal'>(opcional)</span>
              </Label>
              <Input
                type='text'
                placeholder='Ex.: audiência, férias ou compromisso'
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className='pt-4 border-t border-border flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3'>
            <Button
              type='button'
              variant='brand'
              onClick={() => setModalBlockOpen(false)}
              disabled={isAddingBlock}
              className='rounded-full px-5'
            >
              Cancelar
            </Button>
            <Button
              type='button'
              onClick={handleAddBlock}
              disabled={isAddingBlock || !startDate}
              className='rounded-full px-5 gap-1.5'
            >
              {isAddingBlock ? (
                <>
                  <Loader2 className='size-4 animate-spin' />
                  Salvando...
                </>
              ) : (
                'Adicionar bloqueio'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
