import { Module } from '@nestjs/common'
import { SharedDatabaseModule } from '@/shared/database/drizzle/database.module'
import { INTAKE_LIST_REPOSITORIES } from '@/intake/constants/intake-list-repositories'
import { INTAKE_REPOSITORIES } from '@/intake/constants/intake-repositories'
import { DrizzleIntakeMapper } from '@/intake/database/drizzle/mappers/drizzle-intake-mapper'
import {
  DrizzleIntakeListRepository,
  DrizzleIntakesRepository,
} from '@/intake/database/drizzle/repositories'
import { IntakeSeeder } from '@/intake/database/intake-seeder'

@Module({
  imports: [SharedDatabaseModule],
  providers: [
    DrizzleIntakeMapper,
    DrizzleIntakeListRepository,
    DrizzleIntakesRepository,
    {
      provide: INTAKE_LIST_REPOSITORIES.intakeList,
      useExisting: DrizzleIntakeListRepository,
    },
    {
      provide: INTAKE_REPOSITORIES.intakes,
      useExisting: DrizzleIntakesRepository,
    },
    IntakeSeeder,
  ],
  exports: [
    INTAKE_LIST_REPOSITORIES.intakeList,
    INTAKE_REPOSITORIES.intakes,
    IntakeSeeder,
  ],
})
export class IntakeDatabaseModule {}
