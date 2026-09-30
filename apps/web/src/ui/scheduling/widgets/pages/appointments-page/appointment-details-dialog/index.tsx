import { useEffect, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  ExternalLink,
  History,
  Scale,
} from 'lucide-react'

import { Button } from '@/ui/shadcn/button'
import { Anchor } from '@/ui/shared/widgets/components/anchor'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/ui/shadcn/dialog'
import { formatDateTime, formatDuration, formatTime } from '@/ui/scheduling/date-utils'
import { useAppointmentDetailsDialog } from './use-appointment-details-dialog'
import { CancelAppointmentDialog } from './cancel-appointment-dialog'
import { RescheduleAppointmentDialog } from './reschedule-appointment-dialog'

export type AppointmentDetailsDialogProps = {
  open: boolean
  appointmentId?: string
  trigger?: HTMLElement | null
  onOpenChange: (open: boolean) => void
}

export function AppointmentDetailsDialog({
  open,
  appointmentId,
  trigger,
  onOpenChange,
}: AppointmentDetailsDialogProps) {
  const triggerRef = useRef<HTMLElement | null>(null)
  useEffect(() => {
    if (open && trigger) triggerRef.current = trigger
  }, [open, trigger])

  const controller = useAppointmentDetailsDialog(open, appointmentId)
  const navigate = useNavigate()
  const [isCancelOpen, setIsCancelOpen] = useState(false)
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false)
  const detail = controller.details
  const isEligibleForChanges = Boolean(
    detail?.status === 'scheduled' &&
      !detail.consultationStartedAt &&
      !['completed', 'no_show', 'in_progress'].includes(detail.consultationStatus ?? ''),
  )
  const canCancel = Boolean(controller.canManageAppointments && isEligibleForChanges)
  const canReschedule = Boolean(
    controller.canRescheduleAppointments && isEligibleForChanges,
  )

  function closeAfterAction() {
    setIsCancelOpen(false)
    setIsRescheduleOpen(false)
    void controller.refetch()
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className='max-h-[calc(100vh-1rem)] overflow-y-auto p-5 sm:max-w-2xl'
          onCloseAutoFocus={(event) => {
            event.preventDefault()
            triggerRef.current?.focus()
            triggerRef.current = null
          }}
        >
          {controller.isPending ? (
            <div
              className='py-12 text-center text-sm text-muted-foreground'
              role='status'
            >
              Carregando detalhes…
            </div>
          ) : controller.isError ? (
            <div className='space-y-3 py-8 text-center' role='alert'>
              <h2 className='font-serif text-xl font-semibold'>Detalhes indisponíveis</h2>
              <p className='text-sm text-muted-foreground'>
                Este agendamento não está disponível para o seu perfil ou falhou ao
                carregar.
              </p>
              <Button variant='outline' onClick={() => void controller.refetch()}>
                Tentar novamente
              </Button>
            </div>
          ) : detail ? (
            <>
              <DialogHeader className='border-b border-border pb-4'>
                <DialogTitle className='font-serif text-2xl'>
                  Consulta agendada
                </DialogTitle>
                <DialogDescription>
                  Confira os detalhes antes de iniciar ou alterar o compromisso.
                </DialogDescription>
              </DialogHeader>
              <div className='flex items-center gap-3 rounded-xl bg-highlight/60 p-4'>
                <span className='flex size-12 items-center justify-center rounded-full bg-brand text-sm font-semibold text-brand-foreground'>
                  {detail.clientName
                    .split(' ')
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join('')}
                </span>
                <div className='min-w-0 flex-1'>
                  <Anchor
                    route='clientDetails'
                    params={{ clienteId: detail.clientId }}
                    className='block truncate font-semibold underline decoration-primary/50 underline-offset-4 hover:decoration-primary focus-visible:outline-2 focus-visible:outline-ring'
                  >
                    {detail.clientName}
                  </Anchor>
                  <p className='text-xs text-muted-foreground'>
                    Cliente com identificação protegida
                  </p>
                </div>
                <span className='rounded-full bg-card px-3 py-1 text-xs font-semibold text-primary'>
                  {getStatusLabel(detail)}
                </span>
              </div>
              <div className='space-y-3'>
                <p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
                  Resumo do agendamento
                </p>
                <div className='grid gap-4 rounded-xl border border-border p-4 sm:grid-cols-[120px_1fr]'>
                  <div className='flex flex-col items-center justify-center rounded-lg bg-highlight/60 p-3 text-center'>
                    <CalendarDays
                      className='mb-2 size-5 text-primary'
                      aria-hidden='true'
                    />
                    <p className='font-serif text-3xl font-semibold'>
                      {new Date(detail.startsAt).toLocaleDateString('pt-BR', {
                        timeZone: detail.timeZone,
                        day: '2-digit',
                      })}
                    </p>
                    <p className='text-sm font-semibold uppercase text-primary'>
                      {new Date(detail.startsAt).toLocaleDateString('pt-BR', {
                        timeZone: detail.timeZone,
                        month: 'short',
                      })}
                    </p>
                  </div>
                  <div className='space-y-3'>
                    <div>
                      <p className='text-xs uppercase text-muted-foreground'>Horário</p>
                      <p className='font-serif text-2xl font-semibold'>
                        {formatTime(detail.startsAt, detail.timeZone)} –{' '}
                        {formatTime(detail.endsAt, detail.timeZone)}
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        {formatDuration(detail.startsAt, detail.endsAt)} min ·{' '}
                        {detail.timeZone}
                      </p>
                    </div>
                    <div className='border-t border-border pt-3'>
                      <p className='text-xs uppercase text-muted-foreground'>
                        Advogado responsável
                      </p>
                      <p className='flex items-center gap-2 font-semibold'>
                        <Scale className='size-4 text-primary' aria-hidden='true' />
                        <Anchor
                          route='collaboratorDetails'
                          params={{ colaboradorId: detail.lawyerId }}
                          className='underline decoration-primary/50 underline-offset-4 hover:decoration-primary focus-visible:outline-2 focus-visible:outline-ring'
                        >
                          {detail.lawyerName}
                        </Anchor>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className='rounded-xl bg-highlight/60 p-4'>
                <div className='flex items-start gap-3'>
                  <CheckCircle2
                    className='mt-0.5 size-5 text-primary'
                    aria-hidden='true'
                  />
                  <div className='min-w-0 flex-1'>
                    <p className='font-semibold'>
                      {getConsultationLabel(detail.consultationStatus)}
                    </p>
                    <p className='mt-1 text-xs text-muted-foreground'>
                      {detail.consultationStartedAt
                        ? `Iniciada em ${formatDateTime(detail.consultationStartedAt, detail.timeZone)}.`
                        : 'A Consulta permanece disponível para a pessoa responsável quando aplicável.'}
                    </p>
                  </div>
                  {controller.canOpenConsultation ? (
                    <Button
                      type='button'
                      size='sm'
                      onClick={() =>
                        void navigate({
                          to: '/consultas/$consultationId',
                          params: { consultationId: detail.consultationId as string },
                        })
                      }
                    >
                      <ExternalLink className='size-4' aria-hidden='true' />
                      Abrir consulta
                    </Button>
                  ) : null}
                </div>
              </div>
              {detail.changes.length > 0 ? (
                <div className='space-y-2 border-t border-border pt-4'>
                  <p className='flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
                    <History className='size-4' aria-hidden='true' />
                    Histórico
                  </p>
                  {detail.changes.map((change) => (
                    <div key={change.id} className='rounded-lg bg-muted/40 p-3 text-xs'>
                      <p className='font-semibold'>
                        {change.kind === 'cancelled'
                          ? 'Agendamento cancelado'
                          : 'Agendamento remarcado'}{' '}
                        por {change.actorName}
                      </p>
                      <p className='text-muted-foreground'>
                        {formatDateTime(change.occurredAt)}
                        {change.newStartsAt
                          ? ` · novo horário ${formatDateTime(change.newStartsAt, detail.timeZone)}`
                          : ''}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
              {!isEligibleForChanges && detail.status === 'scheduled' ? (
                <p className='flex items-center gap-2 border-t border-border pt-4 text-sm text-muted-foreground'>
                  <Clock3 className='size-4' aria-hidden='true' />
                  Este compromisso não pode mais ser alterado porque a Consulta já iniciou
                  ou foi encerrada.
                </p>
              ) : null}
              <div className='flex flex-row justify-end gap-2 border-t border-border pt-4'>
                {controller.canManageAppointments ? (
                  <Button
                    type='button'
                    variant='destructive'
                    disabled={!canCancel}
                    onClick={() => setIsCancelOpen(true)}
                  >
                    Cancelar agendamento
                  </Button>
                ) : null}
                {controller.canRescheduleAppointments ? (
                  <Button
                    type='button'
                    variant='brand'
                    disabled={!canReschedule}
                    onClick={() => setIsRescheduleOpen(true)}
                  >
                    Remarcar
                  </Button>
                ) : null}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
      <CancelAppointmentDialog
        open={isCancelOpen}
        detail={detail ?? undefined}
        onOpenChange={setIsCancelOpen}
        onSuccess={closeAfterAction}
      />
      <RescheduleAppointmentDialog
        open={isRescheduleOpen}
        detail={detail ?? undefined}
        canReschedule={controller.canRescheduleAppointments}
        canSelectLawyer={controller.canManageAppointments}
        onOpenChange={setIsRescheduleOpen}
        onSuccess={closeAfterAction}
        onReloadDetail={() => controller.refetch({ throwOnError: true })}
      />
    </>
  )
}

function getStatusLabel(detail: {
  status: 'scheduled' | 'cancelled'
  consultationStatus?: string
}) {
  if (detail.status === 'cancelled') return 'Cancelado'
  if (detail.consultationStatus === 'no_show') return 'Não compareceu'
  if (detail.consultationStatus === 'completed') return 'Concluído'
  if (detail.consultationStatus === 'in_progress') return 'Em andamento'
  return 'Agendado'
}

function getConsultationLabel(status?: string) {
  if (status === 'completed') return 'Consulta concluída'
  if (status === 'no_show') return 'Não comparecimento registrado'
  if (status === 'in_progress') return 'Consulta em andamento'
  return 'Consulta pronta para iniciar'
}
