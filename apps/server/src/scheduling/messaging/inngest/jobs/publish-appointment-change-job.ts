import { Inject, Injectable } from '@nestjs/common'
import {
  AppointmentCancelledEvent,
  AppointmentRescheduledEvent,
} from '@hms/core/scheduling/domain/events'
import { appointmentChangeEventSchema } from '@hms/validation/scheduling'
import type { InngestFunction } from 'inngest'

import { DrizzleAppointmentsRepository } from '@/scheduling/database/drizzle/repositories/drizzle-appointments-repository'
import { InngestBroker } from '@/shared/messaging/inngest/inngest-broker'
import { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import { InngestJob } from '@/shared/messaging/inngest/inngest-job'

@Injectable()
export class PublishAppointmentChangeJob extends InngestJob {
  readonly function: InngestFunction.Like

  constructor(
    inngest: InngestClient,
    private readonly appointmentsRepository: DrizzleAppointmentsRepository,
    @Inject(InngestBroker) private readonly broker: InngestBroker,
  ) {
    super(inngest)

    this.function = this.inngest.createFunction(
      {
        id: 'scheduling/publish-appointment-changes',
        name: 'Publish Appointment Changes',
        triggers: [{ cron: '*/1 * * * *' }],
      },
      async ({ step }) => {
        const pending = await step.run('load-pending-appointment-changes', () =>
          this.appointmentsRepository.listPendingChanges(50),
        )

        for (const { change, appointment } of pending) {
          const cancelled = change.kind === 'cancelled'
          const name = cancelled
            ? AppointmentCancelledEvent._NAME
            : AppointmentRescheduledEvent._NAME
          const payload = cancelled
            ? {
                changeId: change.id,
                appointmentId: appointment.id,
                scheduleId: appointment.scheduleId,
                clientId: appointment.clientId,
                actorId: change.actorId,
                startsAt: new Date(appointment.startsAt).toISOString(),
                endsAt: new Date(appointment.endsAt).toISOString(),
                cancelledAt: new Date(change.occurredAt).toISOString(),
              }
            : change.newStartsAt &&
                change.newEndsAt &&
                change.previousScheduleId &&
                change.newScheduleId
              ? {
                  changeId: change.id,
                  appointmentId: appointment.id,
                  previousScheduleId: change.previousScheduleId,
                  newScheduleId: change.newScheduleId,
                  clientId: appointment.clientId,
                  actorId: change.actorId,
                  previousStartsAt: new Date(change.previousStartsAt).toISOString(),
                  previousEndsAt: new Date(change.previousEndsAt).toISOString(),
                  newStartsAt: new Date(change.newStartsAt).toISOString(),
                  newEndsAt: new Date(change.newEndsAt).toISOString(),
                  rescheduledAt: new Date(change.occurredAt).toISOString(),
                }
              : undefined

          if (!payload) continue

          const validated = appointmentChangeEventSchema.parse({ name, payload })
          await step.run(`publish-appointment-change-${change.id}`, () => {
            if (change.kind === 'cancelled') {
              const cancelledPayload = validated.payload as Extract<
                typeof validated,
                { name: 'scheduling/appointment.cancelled' }
              >['payload']
              return this.broker.publish(
                new AppointmentCancelledEvent({
                  ...cancelledPayload,
                  startsAt: new Date(cancelledPayload.startsAt),
                  endsAt: new Date(cancelledPayload.endsAt),
                  cancelledAt: new Date(cancelledPayload.cancelledAt),
                }),
                change.id,
              )
            }

            const rescheduledPayload = validated.payload as Extract<
              typeof validated,
              { name: 'scheduling/appointment.rescheduled' }
            >['payload']
            return this.broker.publish(
              new AppointmentRescheduledEvent({
                ...rescheduledPayload,
                previousStartsAt: new Date(rescheduledPayload.previousStartsAt),
                previousEndsAt: new Date(rescheduledPayload.previousEndsAt),
                newStartsAt: new Date(rescheduledPayload.newStartsAt),
                newEndsAt: new Date(rescheduledPayload.newEndsAt),
                rescheduledAt: new Date(rescheduledPayload.rescheduledAt),
              }),
              change.id,
            )
          })
          await step.run(`mark-appointment-change-published-${change.id}`, () =>
            this.appointmentsRepository.markChangePublished(change.id, new Date()),
          )
        }

        return { published: pending.length }
      },
    )
  }
}
