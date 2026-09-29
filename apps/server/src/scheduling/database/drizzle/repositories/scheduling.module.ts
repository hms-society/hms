import { Module } from '@nestjs/common'
import { AddBlockedPeriodUseCase } from '@hms/core/scheduling/domain/use-cases'
import type { SchedulesRepository } from '@hms/core/scheduling/interfaces'

import { SCHEDULING_REPOSITORIES } from '@/scheduling/constants/scheduling-repositories'
import { SchedulesController } from './rest/controllers/index'
import { SchedulingDatabaseModule } from '../../scheduling-database.module'
import { SchedulingMessagingModule } from '@/scheduling/messaging/scheduling-messaging.module'

@Module({
  imports: [SchedulingDatabaseModule, SchedulingMessagingModule],
  controllers: [SchedulesController],
  providers: [
    {
      provide: AddBlockedPeriodUseCase,
      useFactory: (schedulesRepository: SchedulesRepository) => {
        return new AddBlockedPeriodUseCase(schedulesRepository)
      },
      inject: [SCHEDULING_REPOSITORIES.schedules],
    },
  ],
  exports: [SchedulingMessagingModule],
})
export class SchedulingModule {}
