import { Module } from '@nestjs/common'

import { IntakeDatabaseModule } from '@/intake/database/intake-database.module'
import {
  CompleteIntakeAfterConsultationJob,
  CompleteIntakeConsultationSchedulingJob,
  FailIntakeConsultationSchedulingJob,
  SyncIntakeLegalContextJob,
} from '@/intake/messaging/inngest/jobs'
import { SharedMessagingModule } from '@/shared/messaging/shared-messaging.module'
import type { InngestFunctionGroup } from '@/shared/messaging/inngest/inngest-options'

export const INTAKE_INNGEST_FUNCTIONS = Symbol('INTAKE_INNGEST_FUNCTIONS')

@Module({
  imports: [IntakeDatabaseModule, SharedMessagingModule],
  providers: [
    CompleteIntakeAfterConsultationJob,
    CompleteIntakeConsultationSchedulingJob,
    FailIntakeConsultationSchedulingJob,
    SyncIntakeLegalContextJob,
    {
      provide: INTAKE_INNGEST_FUNCTIONS,
      inject: [
        CompleteIntakeAfterConsultationJob,
        CompleteIntakeConsultationSchedulingJob,
        FailIntakeConsultationSchedulingJob,
        SyncIntakeLegalContextJob,
      ],
      useFactory: (
        completeAfterConsultationJob: CompleteIntakeAfterConsultationJob,
        completeJob: CompleteIntakeConsultationSchedulingJob,
        failJob: FailIntakeConsultationSchedulingJob,
        syncLegalContextJob: SyncIntakeLegalContextJob,
      ): InngestFunctionGroup => [
        completeAfterConsultationJob.function,
        completeJob.function,
        failJob.function,
        syncLegalContextJob.function,
      ],
    },
  ],
  exports: [
    CompleteIntakeAfterConsultationJob,
    CompleteIntakeConsultationSchedulingJob,
    FailIntakeConsultationSchedulingJob,
    SyncIntakeLegalContextJob,
    INTAKE_INNGEST_FUNCTIONS,
  ],
})
export class IntakeMessagingModule {}
