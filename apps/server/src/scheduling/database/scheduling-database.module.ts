import { Module } from '@nestjs/common'
import { databaseProviders } from '@/shared/database/drizzle/database.provider'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { DrizzleSchedulesRepository } from './drizzle/repositories/drizzle-schedules-repository'

@Module({
  providers: [DrizzleClient, ...databaseProviders, DrizzleSchedulesRepository],
  exports: [DrizzleSchedulesRepository, ...databaseProviders],
})
export class SchedulingDatabaseModule {}
