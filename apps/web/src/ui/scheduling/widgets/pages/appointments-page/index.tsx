import { AppointmentDetailsDialog } from './appointment-details-dialog'
import { CalendarFeedback } from './calendar-feedback'
import { CalendarToolbar } from './calendar-toolbar'
import { ClientFilterDialog } from './client-filter-dialog'
import { DayEventsDialog } from './day-events-dialog'
import { MobileDayList } from './mobile-day-list'
import { MonthCalendar } from './month-calendar'
import { WeekCalendar } from './week-calendar'
import { useAppointmentsPage } from './use-appointments-page'
import { LawyerSelectorDialog } from '@/ui/identity/widgets/components/lawyer-selector-dialog'
import { getLocalDate } from '@/ui/scheduling/date-utils'

export type AppointmentsPageProps = Record<string, never>

export function AppointmentsPage(_props: AppointmentsPageProps) {
  const controller = useAppointmentsPage()
  const overflowDate = controller.overflowDate
  const overflowEvents = overflowDate
    ? controller.events.filter((event) =>
        event.kind === 'block'
          ? overflowDate >= event.startsOn && overflowDate <= event.endsOn
          : getLocalDate(event.startsAt, event.timeZone) === overflowDate,
      )
    : []

  return (
    <div className='flex w-full flex-col gap-4'>
      <header className='flex flex-col gap-1'>
        <h1 className='font-serif text-3xl font-semibold text-primary sm:text-4xl'>
          Agenda de Consultas
        </h1>
        <p className='text-sm text-muted-foreground'>
          Visualize e gerencie os compromissos agendados.
        </p>
      </header>
      <CalendarToolbar
        view={controller.search.view}
        date={controller.date}
        clientId={controller.search.clientId}
        lawyerId={controller.search.lawyerId}
        lawyerLabel={controller.lawyerLabel}
        event={controller.search.event}
        showBlockedFilter={controller.showBlockedFilter}
        onViewChange={controller.handleChangeView}
        onPrevious={() => controller.handleMovePeriod(-1)}
        onNext={() => controller.handleMovePeriod(1)}
        onLawyerFilterOpen={() => controller.setIsLawyerSelectorOpen(true)}
        onEventChange={(event) => controller.updateSearch({ event })}
        onClientFilterOpen={() => controller.setIsClientFilterOpen(true)}
        onClearFilters={controller.handleClearFilters}
      />
      <main>
        {controller.pageState !== 'success' ? (
          <CalendarFeedback
            variant={controller.pageState}
            onRetry={controller.retry}
            onClearFilters={controller.handleClearFilters}
          />
        ) : (
          <>
            <div className='hidden md:block'>
              {controller.search.view === 'week' ? (
                <WeekCalendar
                  date={controller.date}
                  events={controller.events}
                  onOpenAppointment={controller.openAppointment}
                />
              ) : (
                <MonthCalendar
                  date={controller.date}
                  events={controller.events}
                  onOpenAppointment={controller.openAppointment}
                  onOpenOverflow={controller.openOverflow}
                />
              )}
            </div>
            <div className='md:hidden'>
              <MobileDayList
                view={controller.search.view}
                date={controller.date}
                events={controller.events}
                onOpenAppointment={controller.openAppointment}
              />
            </div>
          </>
        )}
      </main>
      <ClientFilterDialog
        open={controller.isClientFilterOpen}
        selectedClientId={controller.search.clientId}
        onOpenChange={controller.setIsClientFilterOpen}
        onApply={(clientId) => controller.updateSearch({ clientId })}
      />
      <LawyerSelectorDialog
        open={controller.isLawyerSelectorOpen}
        onOpenChange={controller.setIsLawyerSelectorOpen}
        selectedLawyer={controller.search.lawyerId}
        onSelect={(lawyer) => controller.updateSearch({ lawyerId: lawyer.value })}
        description='Busque por nome ou refine pelos campos jurídicos para filtrar a agenda.'
      />
      <DayEventsDialog
        open={Boolean(controller.overflowDate)}
        date={overflowDate}
        trigger={controller.overflowTrigger}
        events={overflowEvents}
        onOpenChange={(open) => !open && controller.closeOverflow()}
        onOpenAppointment={controller.openAppointment}
      />
      <AppointmentDetailsDialog
        open={Boolean(controller.selectedAppointmentId)}
        appointmentId={controller.selectedAppointmentId}
        trigger={controller.appointmentTrigger}
        onOpenChange={(open) => {
          if (!open) controller.closeAppointment()
        }}
      />
    </div>
  )
}
