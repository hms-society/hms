import { Module } from '@nestjs/common'

import { ConsultationDatabaseModule } from '@/consultation/database/consultation-database.module'
import { CreateConsultationFromAppointmentJob } from '@/consultation/messaging/inngest/jobs'
import { SharedMessagingModule } from '@/shared/messaging/shared-messaging.module'
import { ProvisionModule } from '@/shared/provision/provision.module'

@Module({
  imports: [ConsultationDatabaseModule, SharedMessagingModule, ProvisionModule],
  providers: [CreateConsultationFromAppointmentJob],
  exports: [CreateConsultationFromAppointmentJob],
})
export class ConsultationMessagingModule {}
