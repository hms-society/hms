import { Module } from '@nestjs/common'
import { AddBlockedPeriodUseCase } from '@hms/core/scheduling/domain/use-cases'

import { SchedulesController } from './rest/controllers/index'
import { DrizzleSchedulesRepository } from '../repositories/drizzle-schedules-repository'
import { SchedulingDatabaseModule } from '../../scheduling-database.module'

@Module({
  imports: [SchedulingDatabaseModule],
  controllers: [SchedulesController],
  providers: [
    DrizzleSchedulesRepository,

    {
      provide: AddBlockedPeriodUseCase,
      useFactory: (schedulesRepository: DrizzleSchedulesRepository) => {
        return new AddBlockedPeriodUseCase(schedulesRepository)
      },
      inject: [DrizzleSchedulesRepository],
    },
  ],
})
export class SchedulingModule {}
