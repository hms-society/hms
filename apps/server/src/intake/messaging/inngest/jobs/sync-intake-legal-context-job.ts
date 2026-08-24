import { Inject, Injectable } from '@nestjs/common'
import { ConsultationLegalContextUpdatedEvent } from '@hms/core/consultation/domain/events'
import type { IntakesRepository } from '@hms/core/intake/interfaces'
import { UpdateIntakeLegalContextUseCase } from '@hms/core/intake/use-cases'
import { eventType, type InngestFunction } from 'inngest'
import { z } from 'zod'

import { INTAKE_REPOSITORIES } from '@/intake/constants/intake-repositories'
import { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import { InngestJob } from '@/shared/messaging/inngest/inngest-job'

const consultationLegalContextUpdatedEvent = eventType(
  ConsultationLegalContextUpdatedEvent._NAME,
  {
    schema: z.object({
      consultationId: z.string().uuid(),
      intakeId: z.string().uuid(),
      legalAreaId: z.string().uuid(),
      legalTopicId: z.string().uuid(),
      updatedBy: z.string().uuid(),
      occurredAt: z.string().datetime(),
    }),
  },
)

@Injectable()
export class SyncIntakeLegalContextJob extends InngestJob {
  readonly function: InngestFunction.Like

  constructor(
    inngest: InngestClient,
    @Inject(INTAKE_REPOSITORIES.intakes) intakesRepository: IntakesRepository,
  ) {
    super(inngest)

    const useCase = new UpdateIntakeLegalContextUseCase(intakesRepository)

    this.function = this.inngest.createFunction(
      {
        id: 'intake/sync-legal-context-from-consultation',
        name: 'Sync Intake Legal Context From Consultation',
        triggers: [consultationLegalContextUpdatedEvent],
      },
      ({ event, step }) =>
        step.run('sync-intake-legal-context', () =>
          useCase.execute({
            intakeId: event.data.intakeId,
            legalAreaId: event.data.legalAreaId,
            legalTopicId: event.data.legalTopicId,
            updatedBy: event.data.updatedBy,
          }),
        ),
    )
  }
}
