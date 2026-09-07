import { Inject, Injectable } from '@nestjs/common'
import { ConsultationCompletedEvent } from '@hms/core/consultation/domain/events'
import type { IntakesRepository } from '@hms/core/intake/interfaces'
import { CompleteIntakeAfterConsultationUseCase } from '@hms/core/intake/use-cases'
import { AppError } from '@hms/core/shared/domain/errors'
import { eventType, type InngestFunction, NonRetriableError } from 'inngest'
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
  static readonly ID = 'intake/complete-after-consultation'
  readonly function: InngestFunction.Like

  constructor(
    inngest: InngestClient,
    @Inject(INTAKE_REPOSITORIES.intakes) intakesRepository: IntakesRepository,
  ) {
    super(inngest)

    const useCase = new CompleteIntakeAfterConsultationUseCase(intakesRepository)

    this.function = this.inngest.createFunction(
      {
        id: CompleteIntakeAfterConsultationJob.ID,
        name: 'Complete Intake After Consultation',
        triggers: [consultationCompletedEvent],
      },
      ({ event, step }) =>
        step.run('complete-intake-after-consultation', async () => {
          try {
            return await useCase.execute({
              intakeId: event.data.intakeId,
              updatedBy: event.data.completedBy,
            })
          } catch (error) {
            if (error instanceof AppError) {
              throw new NonRetriableError(error.message, { cause: error })
            }

            throw error
          }
        }),
    )
  }
}
