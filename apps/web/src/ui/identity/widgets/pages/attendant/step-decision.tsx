import { Badge } from '#/ui/shadcn/badge'
import { Avatar, AvatarFallback } from '#/ui/shadcn/avatar'
import { Label } from '#/ui/shadcn/label'
import { Input } from '#/ui/shadcn/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#/ui/shadcn/select'
import { Separator } from '#/ui/shadcn/separator'
import { Calendar } from '#/ui/shadcn/calendar'
import { Textarea } from '#/ui/shadcn/textarea'
import { CalendarDays, MapPin, MessageCircle, Video, Monitor, MoreHorizontal, Clock, DoorOpen, AlertTriangle, Info } from 'lucide-react'
import { useState } from 'react'
import { ptBR } from 'date-fns/locale'

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

export const StepDecision = () => {
  const [tipoCard, setTipoCard] = useState<'agendar' | 'registrar'>('agendar')
  const [modalidade, setModalidade] = useState<'virtual' | 'presencial'>('virtual')
  const [canalVirtual, setCanalVirtual] = useState('whatsapp')
  const [advogadoSelecionado, setAdvogadoSelecionado] = useState('')
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [selectedHorario, setSelectedHorario] = useState('')
  const [motivoSelecionado, setMotivoSelecionado] = useState('')

  const advogado = advogados.find((a) => a.value === advogadoSelecionado)

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => setTipoCard('agendar')}
          className={`flex flex-col items-center gap-1 py-4 rounded-xl border-2 transition-colors ${
            tipoCard === 'agendar'
              ? 'border-primary bg-primary/5 text-primary'
              : 'border-border bg-card text-muted-foreground'
          }`}
        >
          <CalendarDays className="w-5 h-5" />
          <span className="text-[13px] font-serif">Agendar consulta</span>
        </button>
        <button
          onClick={() => setTipoCard('registrar')}
          className={`flex flex-col items-center gap-1 py-4 rounded-xl border-2 transition-colors ${
            tipoCard === 'registrar'
              ? 'border-destructive bg-destructive/5 text-destructive'
              : 'border-border bg-card text-muted-foreground'
          }`}
        >
          <DoorOpen className="w-5 h-5" />
          <span className="text-[13px] font-serif">Encerrar atendimento</span>
        </button>
      </div>

      <Separator />

      {tipoCard === 'agendar' && (
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-primary" />
            <span className="text-[14px] font-serif text-foreground">Dados do agendamento</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Modalidade <span className="text-destructive">*</span></Label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'virtual', label: 'Virtual — WhatsApp', icon: Monitor },
                { value: 'presencial', label: 'Presencial', icon: MapPin },
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setModalidade(value as 'virtual' | 'presencial')}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 text-[13px] font-medium transition-colors ${
                    modalidade === value
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-card text-muted-foreground'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {modalidade === 'virtual' && (
            <div className="flex flex-col gap-1.5">
              <Label>Canal (Virtual) <span className="text-destructive">*</span></Label>
              <div className="grid grid-cols-4 gap-2">
                {canais.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setCanalVirtual(value)}
                    className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-lg border-2 text-[12px] transition-colors ${
                      canalVirtual === value
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border text-muted-foreground'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {modalidade === 'presencial' && (
            <div className="flex flex-col gap-1.5">
              <Label>
                Local <span className="text-destructive">*</span>
              </Label>
              <Input placeholder="Endereço ou sala de atendimento" />
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label>Advogado <span className="text-destructive">*</span></Label>
            <Select onValueChange={setAdvogadoSelecionado}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione um advogado..." />
              </SelectTrigger>
              <SelectContent>
                {advogados.map((a) => (
                  <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {advogado && (
              <div className="flex items-center gap-3 bg-muted/40 border border-border rounded-xl p-3">
                <Avatar>
                  <AvatarFallback className="bg-primary/15 text-primary text-[12px] font-bold">
                    {advogado.iniciais}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-[13px] font-sans text-foreground">{advogado.nome}</span>
                  <span className="text-[11px] text-muted-foreground">{advogado.especialidade}</span>
                </div>
                <Badge variant="outline" className="ml-auto text-primary border-primary/20 bg-primary/5 rounded-pill">
                  <Clock className="w-3 h-3" />
                  {advogado.horarios} horários nos próximos 7 dias
                </Badge>
              </div>
            )}
          </div>

          <Separator />

          <div className="grid grid-cols-[1.5fr_2fr] gap-6">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              locale={ptBR}
              className="rounded-xl border border-border p-3"
              classNames={{
                root: 'w-[85%]',
              }}
            />
            <div className="flex flex-col gap-3">
              <span className="text-[13px] font-sans text-foreground">
                {selectedDate?.toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
              <div className="grid grid-cols-2 gap-2">
                {horarios.map((h) => (
                  <button
                    key={h}
                    onClick={() => setSelectedHorario(h)}
                    className={`py-2 rounded-lg border text-[13px] transition-colors ${
                      selectedHorario === h
                        ? 'border-primary bg-primary/5 text-primary font-sans'
                        : 'border-border text-foreground hover:border-primary/50'
                    }`}
                  >
                    {h}
                  </button>
                ))}
              </div>
              <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Clock className="w-3 h-3" />
                Duração padrão: 45 min · término calculado automaticamente
              </span>
            </div>
          </div>
        </div>
      )}

      {tipoCard === 'registrar' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 border border-destructive/30 bg-card rounded-xl p-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-[14px] font-serif">Motivo do encerramento</span>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Motivo <span className="text-destructive">*</span></Label>
              <Select onValueChange={setMotivoSelecionado}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {motivosEncerramento.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

            </div>

            <div className="flex flex-col gap-1.5 mt-2">
              <Label className="font-sans font-normal">
                Observações <span className="text-muted-foreground">(opcional)</span>
              </Label>
              <Textarea
                placeholder="Detalhes sobre o encerramento..."
                className="resize-none min-h-[90px]"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 bg-muted/50 border border-border rounded-lg px-3 py-2">
            <Info className="w-4 h-4 text-primary shrink-0" />
            <span className="text-[12px] text-primary">
              O cadastro da pessoa é preservado para futuros intakes
            </span>
          </div>

        </div>
      )}
    </div>
  )
}
