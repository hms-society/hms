import { Inject, Injectable } from '@nestjs/common'
import { ConsultationCreatedEvent } from '@hms/core/consultation/domain/events'
import type { IntakesRepository } from '@hms/core/intake/interfaces'
import { ResolveIntakeConsultationSchedulingUseCase } from '@hms/core/intake/use-cases'
import { IntakeConsultationSchedulingOutcome } from '@hms/core/intake/domain/structures'
import { eventType, type InngestFunction } from 'inngest'
import { z } from 'zod'

import { INTAKE_REPOSITORIES } from '@/intake/constants/intake-repositories'
import { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import { InngestJob } from '@/shared/messaging/inngest/inngest-job'

const consultationCreatedEvent = eventType(ConsultationCreatedEvent._NAME, {
  schema: z.object({
    consultationId: z.string().uuid(),
    intakeId: z.string().uuid(),
    requestedBy: z.string().uuid(),
    occurredAt: z.string().datetime(),
  }),
})

@Injectable()
export class CompleteIntakeConsultationSchedulingJob extends InngestJob {
  readonly function: InngestFunction.Like

  constructor(
    inngest: InngestClient,
    @Inject(INTAKE_REPOSITORIES.intakes) intakesRepository: IntakesRepository,
  ) {
    super(inngest)

    const useCase = new ResolveIntakeConsultationSchedulingUseCase(intakesRepository)

    this.function = this.inngest.createFunction(
      {
        id: 'intake/complete-consultation-scheduling',
        name: 'Complete Intake Consultation Scheduling',
        triggers: [consultationCreatedEvent],
      },
      ({ event, step }) =>
        step.run('complete-consultation-scheduling', () =>
          useCase.execute({
            intakeId: event.data.intakeId,
            outcome: IntakeConsultationSchedulingOutcome.Scheduled,
            updatedBy: event.data.requestedBy,
          }),
        ),
    )
  }
}
