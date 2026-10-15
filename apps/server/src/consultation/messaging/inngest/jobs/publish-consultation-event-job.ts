import { Inject, Injectable } from '@nestjs/common'
import {
  ConsultationCompletedEvent,
  ConsultationLegalContextUpdatedEvent,
} from '@hms/core/consultation/domain/events'
import type { ConsultationOutboxRepository } from '@hms/core/consultation/interfaces'
import { consultationOutboxEventSchema } from '@hms/validation/consultation'
import type { InngestFunction } from 'inngest'

import { CONSULTATION_REPOSITORIES } from '@/consultation/constants/consultation-repositories'
import { InngestBroker } from '@/shared/messaging/inngest/inngest-broker'
import { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import { InngestJob } from '@/shared/messaging/inngest/inngest-job'

@Injectable()
export class PublishConsultationEventJob extends InngestJob {
  readonly function: InngestFunction.Like

  constructor(
    inngest: InngestClient,
    @Inject(CONSULTATION_REPOSITORIES.outbox)
    private readonly outboxRepository: ConsultationOutboxRepository,
    @Inject(InngestBroker) private readonly broker: InngestBroker,
  ) {
    super(inngest)

    this.function = this.inngest.createFunction(
      {
        id: 'consultation/publish-outbox-events',
        name: 'Publish Consultation Outbox Events',
        triggers: [{ cron: '*/1 * * * *' }],
      },
      async ({ step }) => {
        const pending = await step.run('load-pending-consultation-events', () =>
          this.outboxRepository.listPending(50),
        )

        for (const event of pending) {
          const validated = consultationOutboxEventSchema.parse({
            id: event.id,
            consultationId: event.consultationId,
            name: event.name,
            payload: event.payload,
            occurredAt: new Date(event.occurredAt).toISOString(),
            ...(event.publishedAt
              ? { publishedAt: new Date(event.publishedAt).toISOString() }
              : {}),
          })

          await step.run(`publish-consultation-event-${event.id}`, () => {
            if (validated.name === ConsultationCompletedEvent._NAME) {
              return this.broker.publish(
                new ConsultationCompletedEvent({
                  ...validated.payload,
                  occurredAt: new Date(validated.payload.occurredAt),
                }),
                event.id,
              )
            }

            return this.broker.publish(
              new ConsultationLegalContextUpdatedEvent({
                ...validated.payload,
                occurredAt: new Date(validated.payload.occurredAt),
              }),
              event.id,
            )
          })
          await step.run(`mark-consultation-event-published-${event.id}`, () =>
            this.outboxRepository.markPublished(event.id, new Date()),
          )
        }

        return { published: pending.length }
      },
    )
  }
}
