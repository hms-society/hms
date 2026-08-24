import { Inject, Injectable } from '@nestjs/common'
import { IntakeConsultationSchedulingFailedEvent } from '@hms/core/intake/domain/events'
import type { IntakesRepository } from '@hms/core/intake/interfaces'
import { ResolveIntakeConsultationSchedulingUseCase } from '@hms/core/intake/use-cases'
import { IntakeConsultationSchedulingOutcome } from '@hms/core/intake/domain/structures'
import { eventType, type InngestFunction } from 'inngest'
import { z } from 'zod'

import { INTAKE_REPOSITORIES } from '@/intake/constants/intake-repositories'
import { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import { InngestJob } from '@/shared/messaging/inngest/inngest-job'

const consultationSchedulingFailedEvent = eventType(
  IntakeConsultationSchedulingFailedEvent._NAME,
  {
    schema: z.object({
      intakeId: z.string().uuid(),
      requestedBy: z.string().uuid(),
      failedAt: z.string().datetime(),
    }),
  },
)

@Injectable()
export class FailIntakeConsultationSchedulingJob extends InngestJob {
  readonly function: InngestFunction.Like

  constructor(
    inngest: InngestClient,
    @Inject(INTAKE_REPOSITORIES.intakes) intakesRepository: IntakesRepository,
  ) {
    super(inngest)

    const useCase = new ResolveIntakeConsultationSchedulingUseCase(intakesRepository)

    this.function = this.inngest.createFunction(
      {
        id: 'intake/fail-consultation-scheduling',
        name: 'Fail Intake Consultation Scheduling',
        triggers: [consultationSchedulingFailedEvent],
      },
      ({ event, step }) =>
        step.run('fail-consultation-scheduling', () =>
          useCase.execute({
            intakeId: event.data.intakeId,
            outcome: IntakeConsultationSchedulingOutcome.Failed,
            updatedBy: event.data.requestedBy,
          }),
        ),
    )
  }
}
