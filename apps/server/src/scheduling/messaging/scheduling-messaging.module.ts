import { Module } from '@nestjs/common'

import { SchedulingDatabaseModule } from '@/scheduling/database/scheduling-database.module'
import { ReserveIntakeAppointmentJob } from '@/scheduling/messaging/inngest/jobs'
import { SharedMessagingModule } from '@/shared/messaging/shared-messaging.module'
import { ProvisionModule } from '@/shared/provision/provision.module'

@Module({
  imports: [SchedulingDatabaseModule, SharedMessagingModule, ProvisionModule],
  providers: [ReserveIntakeAppointmentJob],
  exports: [ReserveIntakeAppointmentJob],
})
export class SchedulingMessagingModule {}
