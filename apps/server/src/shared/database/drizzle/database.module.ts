import { Module } from '@nestjs/common'

import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { DatabaseTransactionContext } from '@/shared/database/drizzle/database-transaction-context'
import { databaseProviders, DRIZZLE } from '@/shared/database/drizzle/database.provider'
import { DYNAMIC_FORMS_REPOSITORIES } from '@/shared/constants/dynamic-forms-repositories'
import { DynamicFormsSeeder } from '@/shared/database/dynamic-forms-seeder'
import { DrizzleDynamicFormMapper } from '@/shared/database/drizzle/mappers'
import { DrizzleDynamicFormsRepository } from '@/shared/database/drizzle/repositories'

@Module({
  providers: [
    DrizzleClient,
    DatabaseTransactionContext,
    ...databaseProviders,
    DrizzleDynamicFormMapper,
    DrizzleDynamicFormsRepository,
    DynamicFormsSeeder,
    {
      provide: DYNAMIC_FORMS_REPOSITORIES.dynamicForms,
      useExisting: DrizzleDynamicFormsRepository,
    },
  ],
  exports: [
    DrizzleClient,
    DatabaseTransactionContext,
    DRIZZLE,
    DYNAMIC_FORMS_REPOSITORIES.dynamicForms,
    DynamicFormsSeeder,
  ],
})
export class SharedDatabaseModule {}
