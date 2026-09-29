import { Module } from '@nestjs/common'

import { SchedulingDatabaseModule } from '@/scheduling/database/scheduling-database.module'
import { ReserveIntakeAppointmentJob } from '@/scheduling/messaging/inngest/jobs'
import { SharedMessagingModule } from '@/shared/messaging/shared-messaging.module'
import { ProvisionModule } from '@/shared/provision/provision.module'
import type { InngestFunctionGroup } from '@/shared/messaging/inngest/inngest-options'

export const SCHEDULING_INNGEST_FUNCTIONS = Symbol('SCHEDULING_INNGEST_FUNCTIONS')

@Module({
  imports: [SchedulingDatabaseModule, SharedMessagingModule, ProvisionModule],
  providers: [
    ReserveIntakeAppointmentJob,
    {
      provide: SCHEDULING_INNGEST_FUNCTIONS,
      inject: [ReserveIntakeAppointmentJob],
      useFactory: (job: ReserveIntakeAppointmentJob): InngestFunctionGroup => [
        job.function,
      ],
    },
  ],
  exports: [ReserveIntakeAppointmentJob, SCHEDULING_INNGEST_FUNCTIONS],
})
export class SchedulingMessagingModule {}
