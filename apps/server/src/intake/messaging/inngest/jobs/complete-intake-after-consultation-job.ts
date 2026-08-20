import { Inject, Injectable } from '@nestjs/common'
import { ConsultationCompletedEvent } from '@hms/core/consultation/domain/events'
import type { IntakesRepository } from '@hms/core/intake/interfaces'
import { CompleteIntakeAfterConsultationUseCase } from '@hms/core/intake/use-cases'
import { eventType, type InngestFunction } from 'inngest'
import { z } from 'zod'

import { INTAKE_REPOSITORIES } from '@/intake/constants/intake-repositories'
import { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import { InngestJob } from '@/shared/messaging/inngest/inngest-job'

const consultationCompletedEvent = eventType(ConsultationCompletedEvent._NAME, {
  schema: z.object({
    consultationId: z.string().uuid(),
    intakeId: z.string().uuid(),
    completedBy: z.string().uuid(),
    occurredAt: z.string().datetime(),
  }),
})

@Injectable()
export class CompleteIntakeAfterConsultationJob extends InngestJob {
  readonly function: InngestFunction.Like

  constructor(
    inngest: InngestClient,
    @Inject(INTAKE_REPOSITORIES.intakes) intakesRepository: IntakesRepository,
  ) {
    super(inngest)

    const useCase = new CompleteIntakeAfterConsultationUseCase(intakesRepository)

    this.function = this.inngest.createFunction(
      {
        id: 'intake/complete-after-consultation',
        name: 'Complete Intake After Consultation',
        triggers: [consultationCompletedEvent],
      },
      ({ event, step }) =>
        step.run('complete-intake-after-consultation', () =>
          useCase.execute({
            intakeId: event.data.intakeId,
            updatedBy: event.data.completedBy,
          }),
        ),
    )
  }
}
