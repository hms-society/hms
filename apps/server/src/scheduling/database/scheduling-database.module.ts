import { Module } from '@nestjs/common'
import { databaseProviders } from '@/shared/database/database.provider'
import { DrizzleClient } from '@/shared/database/drizzle-client'
import { DrizzleSchedulesRepository } from './drizzle/repositories/drizzle-schedules-repository'

@Module({
  providers: [DrizzleClient, ...databaseProviders, DrizzleSchedulesRepository],
  exports: [DrizzleSchedulesRepository, ...databaseProviders],
})
export class SchedulingDatabaseModule {}
