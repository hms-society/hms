import { useState } from 'react'
import { Timer, CalendarDays, Plus, Trash2 } from 'lucide-react'
import { Button } from '#/ui/shadcn/button'
import { Switch } from '#/ui/shadcn/switch'
import { Input } from '#/ui/shadcn/input'
import { Label } from '#/ui/shadcn/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '#/ui/shadcn/dialog'

interface DaySchedule {
  id: string
  name: string
  active: boolean
  slots: { start: string; end: string }[]
}

interface BlockedDate {
  id: string
  dateText: string
  description: string
}

export const Consultation = () => {
  const [duration, setDuration] = useState<'30min' | '45min' | '1h'>('45min')

  const [schedule, setSchedule] = useState<DaySchedule[]>([
    {
      id: 'segunda',
      name: 'Segunda-feira',
      active: true,
      slots: [
        { start: '08:00', end: '12:00' },
        { start: '14:00', end: '17:00' },
      ],
    },
    {
      id: 'terca',
      name: 'Terça-feira',
      active: true,
      slots: [
        { start: '08:00', end: '12:00' },
        { start: '14:00', end: '17:00' },
      ],
    },
    {
      id: 'quarta',
      name: 'Quarta-feira',
      active: true,
      slots: [{ start: '09:00', end: '12:00' }],
    },
    {
      id: 'quinta',
      name: 'Quinta-feira',
      active: true,
      slots: [
        { start: '08:00', end: '12:00' },
        { start: '14:00', end: '17:00' },
      ],
    },
    {
      id: 'sexta',
      name: 'Sexta-feira',
      active: true,
      slots: [{ start: '08:00', end: '12:00' }],
    },
    { id: 'sabado', name: 'Sábado', active: false, slots: [] },
    { id: 'domingo', name: 'Domingo', active: false, slots: [] },
  ])

  const [blocks, setBlocks] = useState<BlockedDate[]>([
    { id: '1', dateText: '2 jul 2026', description: 'Audiência TRT-15' },
    { id: '2', dateText: '10–20 jul 2026', description: 'Férias' },
    { id: '3', dateText: '15–17 jul 2026', description: 'Curso OAB' },
  ])

  const [modalOpen, setModalOpen] = useState(false)
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null)
  const [startTime, setStartTime] = useState('08:00')
  const [endTime, setEndTime] = useState('12:00')
  const [modalBlockOpen, setModalBlockOpen] = useState(false)
  const [startDate, setStartDate] = useState('2026-07-02')
  const [endDate, setEndDate] = useState('2026-07-02')
  const [blockReason, setBlockReason] = useState('')

  const toggleDay = (id: string) => {
    setSchedule((prev) =>
      prev.map((day) => (day.id === id ? { ...day, active: !day.active } : day))
    )
  }

  const removeBlock = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id))
  }

  const handleOpenAddModal = (dayId: string) => {
    setSelectedDayId(dayId)
    setStartTime('08:00')
    setEndTime('12:00')
    setModalOpen(true)
  }

  const handleAddSlot = () => {
    if (!selectedDayId) return
    setSchedule((prev) =>
      prev.map((day) =>
        day.id === selectedDayId
          ? { ...day, slots: [...day.slots, { start: startTime, end: endTime }] }
          : day
      )
    )
    setModalOpen(false)
  }

  const handleOpenAddBlockModal = () => {
    setStartDate('2026-07-02')
    setEndDate('2026-07-02')
    setBlockReason('')
    setModalBlockOpen(true)
  }

  const handleAddBlock = () => {
    if (!startDate) return
    const startObj = new Date(`${startDate}T00:00:00`)
    const endObj = endDate ? new Date(`${endDate}T00:00:00`) : startObj

    const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

    let formattedDate = ''
    if (startDate === endDate || !endDate) {
      formattedDate = `${startObj.getDate()} ${months[startObj.getMonth()]} ${startObj.getFullYear()}`
    } else if (
      startObj.getMonth() === endObj.getMonth() &&
      startObj.getFullYear() === endObj.getFullYear()
    ) {
      formattedDate = `${startObj.getDate()}–${endObj.getDate()} ${months[startObj.getMonth()]} ${startObj.getFullYear()}`
    } else {
      formattedDate = `${startObj.getDate()} ${months[startObj.getMonth()]} – ${endObj.getDate()} ${months[endObj.getMonth()]} ${endObj.getFullYear()}`
    }

    const newBlock: BlockedDate = {
      id: Date.now().toString(),
      dateText: formattedDate,
      description: blockReason.trim() || 'Bloqueio de agenda',
    }

    setBlocks((prev) => [...prev, newBlock])
    setModalBlockOpen(false)
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <div className="flex flex-col gap-1">
        <h1 className="text-ring font-serif text-[24px] font-semibold">
          Configurar agenda
        </h1>
        <p className="text-muted-foreground font-sans text-[14px]">
          Defina sua disponibilidade semanal, duração de consulta e bloqueios
        </p>
      </div>
      <div className="bg-card border border-border rounded-xl p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Timer className="w-5 h-5 text-primary shrink-0" />
          <div className="flex flex-col">
            <span className="text-[14px] font-semibold text-foreground">
              Duração padrão da consulta
            </span>
            <span className="text-[12px] text-muted-foreground">
              Tempo reservado para cada agendamento
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {(
            [
              { id: '30min', label: '30 min' },
              { id: '45min', label: '45 min' },
              { id: '1h', label: '1 hora' },
            ] as const
          ).map((item) => (
            <Button
              key={item.id}
              variant={duration === item.id ? 'default' : 'outline'}
              className="rounded-full px-4"
              onClick={() => setDuration(item.id)}
            >
              {item.label}
            </Button>
          ))}
        </div>
      </div>
      <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-5">
        <div className="flex items-center gap-2 pb-3 border-b border-border">
          <CalendarDays className="w-5 h-5 text-primary shrink-0" />
          <span className="text-[15px] font-semibold text-foreground">
            Disponibilidade semanal
          </span>
        </div>
        <div className="flex flex-col divide-y divide-border/40">
          {schedule.map((day) => (
            <div
              key={day.id}
              className={`flex items-center gap-4 py-3.5 px-2 rounded-lg transition-colors ${
                !day.active ? 'opacity-60 bg-muted/20' : ''
              }`}
            >
              <Switch
                checked={day.active}
                onCheckedChange={() => toggleDay(day.id)}
              />
              <span className="w-32 text-[14px] font-medium text-foreground">
                {day.name}
              </span>
              {day.active ? (
                <div className="flex items-center gap-3 flex-wrap">
                  {day.slots.map((slot, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      {idx > 0 && (
                        <span className="text-[13px] text-muted-foreground px-1">
                          e
                        </span>
                      )}
                      <div className="flex items-center gap-1.5 bg-muted/50 border border-border px-3 py-1.5 rounded-lg text-[13px] text-foreground">
                        <span>{slot.start}</span>
                        <span className="text-muted-foreground">—</span>
                        <span>{slot.end}</span>
                      </div>
                    </div>
                  ))}

                  <Button
                    variant="outline"
                    size="icon"
                    className="size-7 rounded-lg text-primary"
                    onClick={() => handleOpenAddModal(day.id)}
                  >
                    <Plus />
                  </Button>
                </div>
              ) : (
                <span className="text-[13px] text-muted-foreground italic">
                  Indisponível
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-5">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-primary shrink-0" />
            <span className="text-[15px] font-semibold text-foreground">
              Bloqueios de agenda
            </span>
          </div>

          <Button 
            onClick={handleOpenAddBlockModal}
            className="rounded-full px-4 gap-1.5"
          >
            <Plus />
            Adicionar bloqueio
          </Button>
        </div>

        <div className="flex flex-col gap-3">
          {blocks.map((block) => (
            <div
              key={block.id}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full border-2 border-foreground shrink-0 mt-1.5" />
                <div className="flex flex-col">
                  <span className="text-[14px] font-semibold text-foreground">
                    {block.dateText}
                  </span>
                  <span className="text-[12px] text-muted-foreground">
                    {block.description}
                  </span>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:text-destructive"
                onClick={() => removeBlock(block.id)}
              >
                <Trash2 />
              </Button>
            </div>
          ))}
        </div>
      </div>
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-2xl p-6">
          <DialogHeader className="pb-4 border-b border-border">
            <DialogTitle className="font-serif text-[18px] text-foreground">
              Adicionar intervalo
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label className="text-[13px] text-foreground">Horário inicial</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-[13px] text-foreground">Horário final</Label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-border flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="brand"
              onClick={() => setModalOpen(false)}
              className="rounded-full px-5"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleAddSlot}
              className="rounded-full px-5 gap-1.5"
            >
              Adicionar intervalo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={modalBlockOpen} onOpenChange={setModalBlockOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-2xl p-6">
          <DialogHeader className="pb-4 border-b border-border">
            <DialogTitle className="font-serif text-[18px] text-foreground">
              Adicionar bloqueio
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label className="text-[13px] text-foreground">Data inicial</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-[13px] text-foreground">Data final</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-[13px] text-foreground">
                Motivo <span className="text-muted-foreground font-normal">(opcional)</span>
              </Label>
              <Input
                type="text"
                placeholder="Ex.: audiência, férias ou compromisso"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-border flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="brand"
              onClick={() => setModalBlockOpen(false)}
              className="rounded-full px-5"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleAddBlock}
              className="rounded-full px-5 gap-1.5"
            >
              Adicionar bloqueio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}