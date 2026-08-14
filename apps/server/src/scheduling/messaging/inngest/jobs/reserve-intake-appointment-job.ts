import { Inject, Injectable } from '@nestjs/common'
import {
  IntakeConsultationSchedulingFailedEvent,
  IntakeConsultationSchedulingRequestedEvent,
} from '@hms/core/intake/domain/events'
import {
  ConsultationChannel,
  ConsultationModality,
} from '@hms/core/consultation/domain/structures'
import { AppointmentReservedEvent } from '@hms/core/scheduling/domain/events'
import { ReserveIntakeAppointmentUseCase } from '@hms/core/scheduling/domain/use-cases'
import type {
  AppointmentsRepository,
  SchedulesRepository,
} from '@hms/core/scheduling/interfaces'
import { AppError } from '@hms/core/shared/domain/errors'
import { eventType, type InngestFunction, NonRetriableError } from 'inngest'
import { z } from 'zod'

import { SCHEDULING_REPOSITORIES } from '@/scheduling/constants/scheduling-repositories'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { IdProvider } from '@/shared/provision/id/id-provider'
import { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import { InngestJob } from '@/shared/messaging/inngest/inngest-job'

const consultationSchedulingRequestedEvent = eventType(
  IntakeConsultationSchedulingRequestedEvent._NAME,
  {
    schema: z.object({
      intakeId: z.string().uuid(),
      clientId: z.string().uuid(),
      assignedLawyerId: z.string().uuid(),
      legalAreaId: z.string().uuid(),
      legalTopicId: z.string().uuid(),
      demandNotes: z.string().optional(),
      startsAt: z.string().datetime(),
      modality: z.enum(ConsultationModality),
      channel: z.enum(ConsultationChannel).optional(),
      requestedBy: z.string().uuid(),
      occurredAt: z.string().datetime(),
    }),
  },
)

@Injectable()
export class ReserveIntakeAppointmentJob extends InngestJob {
  readonly function: InngestFunction.Like

  constructor(
    inngest: InngestClient,
    @Inject(SCHEDULING_REPOSITORIES.schedules)
    schedulesRepository: SchedulesRepository,
    @Inject(SCHEDULING_REPOSITORIES.appointments)
    appointmentsRepository: AppointmentsRepository,
    idProvider: IdProvider,
    datetimeProvider: DatetimeProvider,
  ) {
    super(inngest)

    const useCase = new ReserveIntakeAppointmentUseCase(
      schedulesRepository,
      appointmentsRepository,
      idProvider,
      datetimeProvider,
    )

    this.function = this.inngest.createFunction(
      {
        id: 'scheduling/reserve-intake-appointment',
        name: 'Reserve Intake Appointment',
        triggers: [consultationSchedulingRequestedEvent],
        onFailure: async ({ event, step }) => {
          const originalEvent = event.data.event
          const failedEvent = new IntakeConsultationSchedulingFailedEvent({
            intakeId: originalEvent.data.intakeId,
            requestedBy: originalEvent.data.requestedBy,
            failedAt: datetimeProvider.now(),
          })

          await step.sendEvent('publish-consultation-scheduling-failed', {
            name: failedEvent.name,
            data: failedEvent.payload,
          })
        },
      },
      async ({ event, step }) => {
        const scheduledIntake = event.data

        const appointment = await step.run('reserve-appointment', async () => {
          try {
            return await useCase.execute({
              intakeId: scheduledIntake.intakeId,
              clientId: scheduledIntake.clientId,
              assignedLawyerId: scheduledIntake.assignedLawyerId,
              startsAt: new Date(scheduledIntake.startsAt),
            })
          } catch (error) {
            if (error instanceof AppError) {
              throw new NonRetriableError(error.message, { cause: error })
            }

            throw error
          }
        })
        const reservedEvent = new AppointmentReservedEvent({
          appointmentId: appointment.id,
          intakeId: scheduledIntake.intakeId,
          scheduleId: appointment.scheduleId,
          clientId: scheduledIntake.clientId,
          assignedLawyerId: scheduledIntake.assignedLawyerId,
          legalAreaId: scheduledIntake.legalAreaId,
          legalTopicId: scheduledIntake.legalTopicId,
          demandNotes: scheduledIntake.demandNotes,
          startsAt: new Date(appointment.startsAt),
          endsAt: new Date(appointment.endsAt),
          reservedAt: new Date(appointment.createdAt),
          modality: scheduledIntake.modality,
          channel: scheduledIntake.channel,
          requestedBy: scheduledIntake.requestedBy,
        })

        await step.sendEvent('publish-appointment-reserved', {
          name: reservedEvent.name,
          data: reservedEvent.payload,
        })
      },
    )
  }
}
