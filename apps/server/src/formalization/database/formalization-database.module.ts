import { Module } from '@nestjs/common'

import {
  FORMALIZATION_DATABASE_OPERATIONS,
  FORMALIZATION_REPOSITORIES,
} from '@/formalization/constants/formalization-repositories'
import { FormalizationSeeder } from '@/formalization/database/formalization-seeder'
import { DrizzleFormalizationStartTransaction } from '@/formalization/database/formalization-start-transaction'
import { DrizzleFormalizationMapper } from '@/formalization/database/drizzle/mappers'
import { DrizzleFormalizationsRepository } from '@/formalization/database/drizzle/repositories'
import { IntakeDatabaseModule } from '@/intake/database/intake-database.module'
import { SharedDatabaseModule } from '@/shared/database/drizzle/database.module'

@Module({
  imports: [SharedDatabaseModule, IntakeDatabaseModule],
  providers: [
    DrizzleFormalizationMapper,
    DrizzleFormalizationsRepository,
    DrizzleFormalizationStartTransaction,
    FormalizationSeeder,
    {
      provide: FORMALIZATION_REPOSITORIES.formalizations,
      useExisting: DrizzleFormalizationsRepository,
    },
    {
      provide: FORMALIZATION_DATABASE_OPERATIONS.startTransaction,
      useExisting: DrizzleFormalizationStartTransaction,
    },
  ],
  exports: [
    FORMALIZATION_REPOSITORIES.formalizations,
    FORMALIZATION_DATABASE_OPERATIONS.startTransaction,
    FormalizationSeeder,
  ],
})
export class FormalizationDatabaseModule {}
