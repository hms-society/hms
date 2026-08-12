import { Inject, Injectable } from '@nestjs/common'
import { AppointmentReservedEvent } from '@hms/core/scheduling/domain/events'
import { AppError } from '@hms/core/shared/domain/errors'
import type { ConsultationsRepository } from '@hms/core/consultation/interfaces'
import { ConsultationCreatedEvent } from '@hms/core/consultation/domain/events'
import {
  ConsultationChannel,
  ConsultationModality,
} from '@hms/core/consultation/domain/structures'
import { IntakeConsultationSchedulingFailedEvent } from '@hms/core/intake/domain/events'
import { CreateConsultationFromAppointmentUseCase } from '@hms/core/consultation/use-cases'
import { eventType, type InngestFunction } from 'inngest'
import { z } from 'zod'

import { CONSULTATION_REPOSITORIES } from '@/consultation/constants/consultation-repositories'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { IdProvider } from '@/shared/provision/id/id-provider'
import { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import { InngestJob } from '@/shared/messaging/inngest/inngest-job'

const appointmentReservedEvent = eventType(AppointmentReservedEvent._NAME, {
  schema: z.object({
    appointmentId: z.string().uuid(),
    intakeId: z.string().uuid(),
    scheduleId: z.string().uuid(),
    clientId: z.string().uuid(),
    assignedLawyerId: z.string().uuid(),
    legalAreaId: z.string().uuid(),
    legalTopicId: z.string().uuid(),
    demandNotes: z.string().optional(),
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime(),
    reservedAt: z.string().datetime(),
    modality: z.enum(ConsultationModality),
    channel: z.enum(ConsultationChannel).optional(),
    requestedBy: z.string().uuid(),
  }),
})

@Injectable()
export class CreateConsultationFromAppointmentJob extends InngestJob {
  readonly function: InngestFunction.Like

  constructor(
    inngest: InngestClient,
    @Inject(CONSULTATION_REPOSITORIES.consultations)
    consultationsRepository: ConsultationsRepository,
    idProvider: IdProvider,
    datetimeProvider: DatetimeProvider,
  ) {
    super(inngest)

    const useCase = new CreateConsultationFromAppointmentUseCase(
      consultationsRepository,
      idProvider,
      datetimeProvider,
    )

    this.function = this.inngest.createFunction(
      {
        id: 'consultation/create-from-appointment',
        name: 'Create Consultation From Appointment',
        triggers: [appointmentReservedEvent],
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
        if (event.data.modality === ConsultationModality.Virtual && !event.data.channel) {
          throw new AppError(
            'A virtual Consultation requires a channel.',
            'Invalid Consultation Event',
          )
        }

        const consultation = await step.run('create-consultation', () =>
          useCase.execute({
            intakeId: event.data.intakeId,
            appointmentId: event.data.appointmentId,
            clientId: event.data.clientId,
            assignedLawyerId: event.data.assignedLawyerId,
            legalAreaId: event.data.legalAreaId,
            legalTopicId: event.data.legalTopicId,
            demandNotes: event.data.demandNotes,
            ...(event.data.modality === ConsultationModality.Virtual
              ? {
                  modality: ConsultationModality.Virtual,
                  channel: event.data.channel as ConsultationChannel,
                }
              : { modality: ConsultationModality.InPerson }),
          }),
        )

        if (!consultation) return

        const createdEvent = new ConsultationCreatedEvent({
          consultationId: consultation.id,
          intakeId: consultation.intakeId,
          requestedBy: event.data.requestedBy,
          occurredAt: datetimeProvider.now(),
        })

        await step.sendEvent('publish-consultation-created', {
          name: createdEvent.name,
          data: createdEvent.payload,
        })
      },
    )
  }
}
