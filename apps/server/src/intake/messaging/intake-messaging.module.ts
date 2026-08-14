import { Module } from '@nestjs/common'

import { IntakeDatabaseModule } from '@/intake/database/intake-database.module'
import {
  CompleteIntakeConsultationSchedulingJob,
  FailIntakeConsultationSchedulingJob,
} from '@/intake/messaging/inngest/jobs'
import { SharedMessagingModule } from '@/shared/messaging/shared-messaging.module'
import type { InngestFunctionGroup } from '@/shared/messaging/inngest/inngest-options'

export const INTAKE_INNGEST_FUNCTIONS = Symbol('INTAKE_INNGEST_FUNCTIONS')

@Module({
  imports: [IntakeDatabaseModule, SharedMessagingModule],
  providers: [
    CompleteIntakeConsultationSchedulingJob,
    FailIntakeConsultationSchedulingJob,
    {
      provide: INTAKE_INNGEST_FUNCTIONS,
      inject: [
        CompleteIntakeConsultationSchedulingJob,
        FailIntakeConsultationSchedulingJob,
      ],
      useFactory: (
        completeJob: CompleteIntakeConsultationSchedulingJob,
        failJob: FailIntakeConsultationSchedulingJob,
      ): InngestFunctionGroup => [completeJob.function, failJob.function],
    },
  ],
  exports: [
    CompleteIntakeConsultationSchedulingJob,
    FailIntakeConsultationSchedulingJob,
    INTAKE_INNGEST_FUNCTIONS,
  ],
})
export class IntakeMessagingModule {}
