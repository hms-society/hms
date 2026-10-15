import { Module } from '@nestjs/common'
import {
  AddBlockedPeriodUseCase,
  AuthorizeScheduleAccessUseCase,
  CancelAppointmentUseCase,
  GetAppointmentDetailsUseCase,
  ListCalendarFilterOptionsUseCase,
  ListCalendarUseCase,
  ListRescheduleSlotsUseCase,
  RescheduleAppointmentUseCase,
} from '@hms/core/scheduling/domain/use-cases'
import type {
  CalendarConsultationProvider,
  CalendarIdentityProvider,
  RescheduledAppointmentConsultationProvider,
} from '@hms/core/shared/interfaces'

import { ConsultationModule } from '@/consultation/consultation.module'
import { CONSULTATION_REPOSITORIES } from '@/consultation/constants/consultation-repositories'
import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import { IdentityModule } from '@/identity/identity.module'
import { SchedulingDatabaseModule } from '@/scheduling/database/scheduling-database.module'
import { SCHEDULING_REPOSITORIES } from '@/scheduling/constants/scheduling-repositories'
import { SchedulingMessagingModule } from '@/scheduling/messaging/scheduling-messaging.module'
import {
  CancelAppointmentController,
  GetAppointmentDetailsController,
  ListCalendarController,
  ListCalendarFilterOptionsController,
  ListRescheduleSlotsController,
  RescheduleAppointmentController,
  SchedulesController,
} from '@/scheduling/rest/controllers'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { IdProvider } from '@/shared/provision/id/id-provider'
import { ProvisionModule } from '@/shared/provision/provision.module'
import type {
  CalendarAppointmentsRepository,
  CalendarSchedulesRepository,
  SchedulingDatabase,
  SchedulesRepository,
} from '@hms/core/scheduling/interfaces'

@Module({
  imports: [
    SchedulingDatabaseModule,
    IdentityModule,
    ConsultationModule,
    SchedulingMessagingModule,
    ProvisionModule,
  ],
  controllers: [
    ListCalendarController,
    GetAppointmentDetailsController,
    ListCalendarFilterOptionsController,
    ListRescheduleSlotsController,
    CancelAppointmentController,
    RescheduleAppointmentController,
    SchedulesController,
  ],
  providers: [
    {
      provide: AuthorizeScheduleAccessUseCase,
      inject: [SCHEDULING_REPOSITORIES.schedules],
      useFactory: (schedulesRepository: SchedulesRepository) =>
        new AuthorizeScheduleAccessUseCase(schedulesRepository),
    },
    {
      provide: AddBlockedPeriodUseCase,
      inject: [SCHEDULING_REPOSITORIES.schedules],
      useFactory: (schedulesRepository: SchedulesRepository) =>
        new AddBlockedPeriodUseCase(schedulesRepository),
    },
    {
      provide: ListCalendarUseCase,
      inject: [
        SCHEDULING_REPOSITORIES.schedules,
        SCHEDULING_REPOSITORIES.appointments,
        IDENTITY_REPOSITORIES.calendarProvider,
        CONSULTATION_REPOSITORIES.calendarProvider,
      ],
      useFactory: (
        schedulesRepository: CalendarSchedulesRepository,
        appointmentsRepository: CalendarAppointmentsRepository,
        identityProvider: CalendarIdentityProvider,
        consultationProvider: CalendarConsultationProvider,
      ) =>
        new ListCalendarUseCase(
          schedulesRepository,
          appointmentsRepository,
          identityProvider,
          consultationProvider,
        ),
    },
    {
      provide: GetAppointmentDetailsUseCase,
      inject: [
        SCHEDULING_REPOSITORIES.appointments,
        SCHEDULING_REPOSITORIES.schedules,
        IDENTITY_REPOSITORIES.calendarProvider,
        CONSULTATION_REPOSITORIES.calendarProvider,
      ],
      useFactory: (
        appointmentsRepository: CalendarAppointmentsRepository,
        schedulesRepository: CalendarSchedulesRepository,
        identityProvider: CalendarIdentityProvider,
        consultationProvider: CalendarConsultationProvider,
      ) =>
        new GetAppointmentDetailsUseCase(
          appointmentsRepository,
          schedulesRepository,
          identityProvider,
          consultationProvider,
        ),
    },
    {
      provide: ListCalendarFilterOptionsUseCase,
      inject: [
        SCHEDULING_REPOSITORIES.schedules,
        SCHEDULING_REPOSITORIES.appointments,
        IDENTITY_REPOSITORIES.calendarProvider,
      ],
      useFactory: (
        schedulesRepository: CalendarSchedulesRepository,
        appointmentsRepository: CalendarAppointmentsRepository,
        identityProvider: CalendarIdentityProvider,
      ) =>
        new ListCalendarFilterOptionsUseCase(
          schedulesRepository,
          appointmentsRepository,
          identityProvider,
        ),
    },
    {
      provide: ListRescheduleSlotsUseCase,
      inject: [
        SCHEDULING_REPOSITORIES.appointments,
        SCHEDULING_REPOSITORIES.schedules,
        DatetimeProvider,
        IDENTITY_REPOSITORIES.calendarProvider,
      ],
      useFactory: (
        appointmentsRepository: CalendarAppointmentsRepository,
        schedulesRepository: CalendarSchedulesRepository,
        datetimeProvider: DatetimeProvider,
        identityProvider: CalendarIdentityProvider,
      ) =>
        new ListRescheduleSlotsUseCase(
          appointmentsRepository,
          schedulesRepository,
          datetimeProvider,
          identityProvider,
        ),
    },
    {
      provide: CancelAppointmentUseCase,
      inject: [
        SCHEDULING_REPOSITORIES.database,
        SCHEDULING_REPOSITORIES.schedules,
        IDENTITY_REPOSITORIES.calendarProvider,
        CONSULTATION_REPOSITORIES.calendarProvider,
        DatetimeProvider,
        IdProvider,
        SCHEDULING_REPOSITORIES.appointments,
      ],
      useFactory: (
        database: SchedulingDatabase,
        schedulesRepository: CalendarSchedulesRepository,
        identityProvider: CalendarIdentityProvider,
        consultationProvider: CalendarConsultationProvider,
        datetimeProvider: DatetimeProvider,
        idProvider: IdProvider,
        appointmentsRepository: CalendarAppointmentsRepository,
      ) =>
        new CancelAppointmentUseCase(
          database,
          schedulesRepository,
          identityProvider,
          consultationProvider,
          datetimeProvider,
          idProvider,
          appointmentsRepository,
        ),
    },
    {
      provide: RescheduleAppointmentUseCase,
      inject: [
        SCHEDULING_REPOSITORIES.database,
        SCHEDULING_REPOSITORIES.schedules,
        IDENTITY_REPOSITORIES.calendarProvider,
        CONSULTATION_REPOSITORIES.calendarProvider,
        DatetimeProvider,
        IdProvider,
        SCHEDULING_REPOSITORIES.appointments,
        CONSULTATION_REPOSITORIES.rescheduledAppointmentProvider,
      ],
      useFactory: (
        database: SchedulingDatabase,
        schedulesRepository: CalendarSchedulesRepository,
        identityProvider: CalendarIdentityProvider,
        consultationProvider: CalendarConsultationProvider,
        datetimeProvider: DatetimeProvider,
        idProvider: IdProvider,
        appointmentsRepository: CalendarAppointmentsRepository,
        rescheduledConsultationProvider: RescheduledAppointmentConsultationProvider,
      ) =>
        new RescheduleAppointmentUseCase(
          database,
          schedulesRepository,
          identityProvider,
          consultationProvider,
          datetimeProvider,
          idProvider,
          appointmentsRepository,
          rescheduledConsultationProvider,
        ),
    },
  ],
  exports: [SchedulingDatabaseModule, SchedulingMessagingModule],
})
export class SchedulingModule {}
