import { Module } from '@nestjs/common'

import { IntakeDatabaseModule } from '@/intake/database/intake-database.module'
import {
  CompleteIntakeConsultationSchedulingJob,
  FailIntakeConsultationSchedulingJob,
} from '@/intake/messaging/inngest/jobs'
import { SharedMessagingModule } from '@/shared/messaging/shared-messaging.module'

@Module({
  imports: [IntakeDatabaseModule, SharedMessagingModule],
  providers: [
    CompleteIntakeConsultationSchedulingJob,
    FailIntakeConsultationSchedulingJob,
  ],
  exports: [CompleteIntakeConsultationSchedulingJob, FailIntakeConsultationSchedulingJob],
})
export class IntakeMessagingModule {}
