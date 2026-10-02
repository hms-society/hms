import { Module } from '@nestjs/common'

import { ConsultationDatabaseModule } from '@/consultation/database/consultation-database.module'
import {
  CreateConsultationFromAppointmentJob,
  PublishConsultationEventJob,
} from '@/consultation/messaging/inngest/jobs'
import { SharedMessagingModule } from '@/shared/messaging/shared-messaging.module'
import { ProvisionModule } from '@/shared/provision/provision.module'
import type { InngestFunctionGroup } from '@/shared/messaging/inngest/inngest-options'

export const CONSULTATION_INNGEST_FUNCTIONS = Symbol('CONSULTATION_INNGEST_FUNCTIONS')

@Module({
  imports: [ConsultationDatabaseModule, SharedMessagingModule, ProvisionModule],
  providers: [
    CreateConsultationFromAppointmentJob,
    PublishConsultationEventJob,
    {
      provide: CONSULTATION_INNGEST_FUNCTIONS,
      inject: [CreateConsultationFromAppointmentJob, PublishConsultationEventJob],
      useFactory: (
        createJob: CreateConsultationFromAppointmentJob,
        publishJob: PublishConsultationEventJob,
      ): InngestFunctionGroup => [createJob.function, publishJob.function],
    },
  ],
  exports: [
    CreateConsultationFromAppointmentJob,
    PublishConsultationEventJob,
    CONSULTATION_INNGEST_FUNCTIONS,
  ],
})
export class ConsultationMessagingModule {}
