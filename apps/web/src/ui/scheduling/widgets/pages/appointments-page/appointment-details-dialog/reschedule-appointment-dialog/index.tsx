import { CollaboratorProfile } from '@hms/core/identity/domain/structures'

import { Button } from '@/ui/shadcn/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/shadcn/dialog'
import { Input } from '@/ui/shadcn/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/shadcn/select'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { formatDateTime, formatDuration, formatTime } from '@/ui/scheduling/date-utils'
import { useRescheduleAppointmentDialog } from './use-reschedule-appointment-dialog'
import type { AppointmentDetailsView } from '@/ui/scheduling/types'

export type RescheduleAppointmentDialogProps = {
  open: boolean
  detail?: AppointmentDetailsView
  canReschedule?: boolean
  canSelectLawyer?: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  onReloadDetail?: () => Promise<unknown>
}

export const RescheduleAppointmentDialog = (props: RescheduleAppointmentDialogProps) => {
  const {
    open,
    detail,
    canReschedule = false,
    canSelectLawyer = false,
    onOpenChange,
    onSuccess,
    onReloadDetail,
  } = props
  const {
    date,
    dateFieldRegistration,
    currentTimeZoneLabel,
    selectedTimeZoneLabel,
    activeLawyers,
    collaboratorsPageError,
    isLoadingCollaborators,
    hasMoreLawyers,
    handleLoadMoreLawyers,
    handleRetryLawyers,
    selectedLawyerId,
    handleLawyerChange,
    slots,
    isLoadingSlots,
    slotsError,
    selectedSlot,
    handleSlotSelect,
    hasRevisionConflict,
    isReloadingConflict,
    handleReloadAfterConflict,
    handleConfirm,
    isRescheduling,
    error,
  } = useRescheduleAppointmentDialog(open, detail, onSuccess, onReloadDetail)
  const selectedLawyer = activeLawyers.find(
    (lawyer) => lawyer.collaboratorId === selectedLawyerId,
  )
  const selectedSlotDetails = slots.find((slot) => slot.startsAt === selectedSlot)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='flex max-h-[calc(100dvh-1rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[600px]'>
        <DialogHeader className='shrink-0 border-b border-border px-5 pb-4 pt-5 sm:px-7'>
          <DialogTitle className='font-serif text-2xl text-brand'>
            Remarcar consulta
          </DialogTitle>
          <DialogDescription className='text-left'>
            {canSelectLawyer
              ? 'Escolha o novo profissional e, depois, um horário disponível.'
              : 'Escolha uma nova data e um horário disponível. O advogado responsável permanece o mesmo.'}
          </DialogDescription>
        </DialogHeader>

        {detail ? (
          <form
            onSubmit={handleConfirm}
            className='flex min-h-0 flex-col overflow-hidden'
          >
            <div className='min-h-0 overflow-y-auto px-5 py-4 sm:px-7'>
              <div className='mb-5 flex items-center gap-3 rounded-xl bg-highlight/60 p-3.5'>
                <span className='flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-highlight text-sm font-semibold text-brand-highlight-foreground'>
                  {detail.clientName
                    .split(' ')
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join('')}
                </span>
                <div className='min-w-0 flex-1'>
                  <p className='truncate text-sm font-semibold text-foreground'>
                    {detail.clientName}
                  </p>
                  <p className='text-xs text-muted-foreground'>Cliente</p>
                </div>
                <span className='inline-flex shrink-0 items-center gap-1.5 rounded-full border border-primary/50 bg-card px-3 py-1.5 text-xs font-medium text-primary'>
                  <span className='size-1.5 rounded-full bg-primary' aria-hidden='true' />
                  Agendado
                </span>
              </div>

              <section aria-labelledby='current-schedule-heading' className='mb-5'>
                <h3
                  id='current-schedule-heading'
                  className='mb-2 text-xs font-semibold uppercase tracking-wide text-primary'
                >
                  Horário atual
                </h3>
                <div className='rounded-xl border border-border bg-muted/30 p-3.5'>
                  <div className='grid gap-3 min-[36rem]:grid-cols-3'>
                    <div>
                      <p className='mb-1.5 flex items-center gap-1.5 text-xs text-muted-foreground'>
                        <Icon name='calendar-days' className='size-4' />
                        Data
                      </p>
                      <p className='text-sm font-medium'>
                        {formatDateTime(detail.startsAt, detail.timeZone).split(',')[0]}
                      </p>
                    </div>
                    <div>
                      <p className='mb-1.5 flex items-center gap-1.5 text-xs text-muted-foreground'>
                        <Icon name='clock' className='size-4' />
                        Horário
                      </p>
                      <p className='text-sm font-medium'>
                        {formatTime(detail.startsAt, detail.timeZone)}–
                        {formatTime(detail.endsAt, detail.timeZone)}
                      </p>
                    </div>
                    <div>
                      <p className='mb-1.5 flex items-center gap-1.5 text-xs text-muted-foreground'>
                        <Icon name='user' className='size-4' />
                        Advogado
                      </p>
                      <p className='truncate text-sm font-medium'>{detail.lawyerName}</p>
                    </div>
                  </div>
                  <p className='mt-3 border-t border-border/70 pt-2 text-xs text-muted-foreground'>
                    {formatDuration(detail.startsAt, detail.endsAt)} min ·{' '}
                    {currentTimeZoneLabel}
                  </p>
                </div>
              </section>

              <div className='space-y-4'>
                <section aria-labelledby='new-schedule-heading'>
                  <h3
                    id='new-schedule-heading'
                    className='text-xs font-semibold uppercase tracking-wide text-primary'
                  >
                    Novo agendamento
                  </h3>
                  <p className='mb-3 mt-1 text-xs text-muted-foreground'>
                    {canSelectLawyer
                      ? 'A data e os horários serão atualizados conforme o advogado escolhido.'
                      : 'A data e os horários disponíveis são da agenda do advogado responsável.'}
                  </p>

                  {canSelectLawyer ? (
                    <>
                      <label
                        htmlFor='reschedule-lawyer'
                        className='mb-1.5 block text-sm font-medium'
                      >
                        Novo advogado
                      </label>
                      <Select
                        value={selectedLawyerId || undefined}
                        onValueChange={handleLawyerChange}
                        disabled={
                          isReloadingConflict ||
                          (isLoadingCollaborators && activeLawyers.length === 0) ||
                          activeLawyers.length === 0
                        }
                      >
                        <SelectTrigger id='reschedule-lawyer' className='w-full bg-card'>
                          <span className='flex min-w-0 items-center gap-2'>
                            <Icon name='user' className='size-4' />
                            <SelectValue
                              placeholder={
                                isLoadingCollaborators && activeLawyers.length === 0
                                  ? 'Carregando advogados…'
                                  : 'Selecione um advogado'
                              }
                            />
                          </span>
                        </SelectTrigger>
                        <SelectContent>
                          {detail.lawyerId &&
                          !activeLawyers.some(
                            (lawyer) => lawyer.collaboratorId === detail.lawyerId,
                          ) ? (
                            <SelectItem value={detail.lawyerId}>
                              {detail.lawyerName} · advogado atual
                            </SelectItem>
                          ) : null}
                          {activeLawyers
                            .filter(
                              (lawyer) => lawyer.profile === CollaboratorProfile.Lawyer,
                            )
                            .map((lawyer) => (
                              <SelectItem
                                key={lawyer.collaboratorId}
                                value={lawyer.collaboratorId}
                              >
                                {lawyer.professionalName}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      {collaboratorsPageError ? (
                        <div
                          role='alert'
                          className='mt-2 flex flex-wrap items-center gap-2'
                        >
                          <p className='text-sm text-destructive'>
                            Não foi possível carregar os advogados ativos.
                          </p>
                          <Button
                            type='button'
                            size='sm'
                            variant='outline'
                            onClick={handleRetryLawyers}
                          >
                            Tentar novamente
                          </Button>
                        </div>
                      ) : hasMoreLawyers ? (
                        <Button
                          type='button'
                          size='sm'
                          variant='ghost'
                          className='mt-1 px-0 text-primary hover:bg-transparent hover:text-primary/80'
                          disabled={isLoadingCollaborators}
                          onClick={handleLoadMoreLawyers}
                        >
                          {isLoadingCollaborators
                            ? 'Carregando advogados…'
                            : 'Carregar mais advogados'}
                        </Button>
                      ) : null}
                    </>
                  ) : (
                    <div>
                      <p className='mb-1.5 block text-sm font-medium'>
                        Advogado responsável
                      </p>
                      <div className='flex min-h-11 items-center gap-2 rounded-lg border border-input bg-muted/30 px-3 py-2 text-sm'>
                        <Icon name='user' className='size-4 shrink-0 text-primary' />
                        <span className='truncate'>{detail.lawyerName}</span>
                      </div>
                    </div>
                  )}
                </section>

                <div className='grid gap-3 min-[36rem]:grid-cols-2'>
                  <div>
                    <label
                      htmlFor='reschedule-date'
                      className='mb-1.5 block text-sm font-medium'
                    >
                      Nova data
                    </label>
                    <Input
                      id='reschedule-date'
                      type='date'
                      className='bg-card'
                      disabled={isReloadingConflict}
                      {...dateFieldRegistration}
                    />
                  </div>
                  <div>
                    <p className='mb-1.5 block text-sm font-medium'>Novo horário</p>
                    <div className='flex h-11 items-center gap-2 rounded-lg border border-input bg-card px-3 text-sm'>
                      <Icon name='clock' className='size-4 text-primary' />
                      <span aria-live='polite'>
                        {selectedSlotDetails
                          ? formatTime(
                              selectedSlotDetails.startsAt,
                              selectedSlotDetails.timeZone,
                            )
                          : 'Selecione um horário'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <p className='mb-2 text-sm font-medium'>
                    Horários disponíveis
                    {canSelectLawyer && selectedLawyer
                      ? ` para ${selectedLawyer.professionalName}`
                      : ''}
                  </p>
                  {isLoadingSlots ? (
                    <p
                      role='status'
                      className='rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground'
                    >
                      Carregando horários disponíveis…
                    </p>
                  ) : slots.length === 0 ? (
                    <p className='rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground'>
                      {(canSelectLawyer ? selectedLawyerId : detail.lawyerId) && date
                        ? 'Nenhum horário disponível nesta data.'
                        : 'Selecione um advogado e uma data para ver os horários.'}
                    </p>
                  ) : (
                    <div className='grid grid-cols-2 gap-2 min-[36rem]:grid-cols-5'>
                      {slots.map((slot) => (
                        <Button
                          key={slot.startsAt}
                          type='button'
                          size='sm'
                          variant={selectedSlot === slot.startsAt ? 'default' : 'outline'}
                          aria-pressed={selectedSlot === slot.startsAt}
                          disabled={isReloadingConflict}
                          onClick={() => handleSlotSelect(slot.startsAt)}
                        >
                          {formatTime(slot.startsAt, slot.timeZone)}
                          <span className='sr-only'>
                            {' '}
                            até {formatTime(slot.endsAt, slot.timeZone)}
                          </span>
                        </Button>
                      ))}
                    </div>
                  )}
                  {selectedSlotDetails ? (
                    <p className='mt-2 text-xs text-muted-foreground'>
                      Duração:{' '}
                      {formatDuration(
                        selectedSlotDetails.startsAt,
                        selectedSlotDetails.endsAt,
                      )}{' '}
                      min · término:{' '}
                      {formatTime(
                        selectedSlotDetails.endsAt,
                        selectedSlotDetails.timeZone,
                      )}{' '}
                      · {selectedTimeZoneLabel}
                    </p>
                  ) : null}
                </div>

                {selectedSlotDetails ? (
                  <div className='flex items-center gap-3 rounded-xl bg-highlight p-3.5'>
                    <span className='flex size-10 shrink-0 items-center justify-center rounded-full bg-card text-primary'>
                      <Icon name='calendar-clock' className='size-5' />
                    </span>
                    <div className='min-w-0'>
                      <p className='text-sm font-semibold'>
                        Novo horário com{' '}
                        {canSelectLawyer
                          ? (selectedLawyer?.professionalName ?? detail.lawyerName)
                          : detail.lawyerName}
                      </p>
                      <p className='mt-0.5 text-xs text-muted-foreground'>
                        {formatDateTime(
                          selectedSlotDetails.startsAt,
                          selectedSlotDetails.timeZone,
                        )}
                        –
                        {formatTime(
                          selectedSlotDetails.endsAt,
                          selectedSlotDetails.timeZone,
                        )}{' '}
                        · {selectedTimeZoneLabel} · o cliente e a consulta permanecem
                        vinculados.
                      </p>
                    </div>
                  </div>
                ) : null}

                {slotsError || error ? (
                  <div role='alert' className='space-y-2 text-sm text-destructive'>
                    <p>
                      {error?.message ??
                        'Não foi possível carregar ou validar os horários. Tente novamente.'}
                    </p>
                    {hasRevisionConflict ? (
                      <Button
                        type='button'
                        variant='outline'
                        disabled={isReloadingConflict}
                        onClick={handleReloadAfterConflict}
                      >
                        {isReloadingConflict
                          ? 'Atualizando dados e horários…'
                          : 'Atualizar dados e horários'}
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
            <DialogFooter className='mx-0 mb-0 shrink-0 gap-2 border-t border-border bg-background px-5 py-4 sm:px-7 min-[36rem]:flex-row min-[36rem]:justify-end'>
              <Button
                type='button'
                variant='outline'
                disabled={isRescheduling || isReloadingConflict}
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                type='submit'
                disabled={
                  !selectedSlot ||
                  !canReschedule ||
                  !(canSelectLawyer ? selectedLawyerId : detail.lawyerId) ||
                  isRescheduling ||
                  isReloadingConflict ||
                  Boolean(canSelectLawyer && collaboratorsPageError)
                }
              >
                {isRescheduling ? 'Confirmando…' : 'Confirmar remarcação'}
              </Button>
            </DialogFooter>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
