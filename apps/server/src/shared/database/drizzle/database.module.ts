import { Module } from '@nestjs/common'

import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { databaseProviders, DRIZZLE } from '@/shared/database/drizzle/database.provider'
import { DYNAMIC_FORMS_REPOSITORIES } from '@/shared/constants/dynamic-forms-repositories'
import { DynamicFormsSeeder } from '@/shared/database/dynamic-forms-seeder'
import { DrizzleDynamicFormMapper } from '@/shared/database/drizzle/mappers'
import { StoredFileMapper } from '@/shared/database/drizzle/mappers/stored-file-mapper'
import { DrizzleDynamicFormsRepository } from '@/shared/database/drizzle/repositories'
import { DrizzleStoredFilesRepository } from '@/shared/database/drizzle/repositories/drizzle-stored-files-repository'

export const STORED_FILES_REPOSITORY = Symbol('STORED_FILES_REPOSITORY')

@Module({
  providers: [
    DrizzleClient,
    ...databaseProviders,
    DrizzleDynamicFormMapper,
    DrizzleDynamicFormsRepository,
    StoredFileMapper,
    DrizzleStoredFilesRepository,
    DynamicFormsSeeder,
    {
      provide: DYNAMIC_FORMS_REPOSITORIES.dynamicForms,
      useExisting: DrizzleDynamicFormsRepository,
    },
    {
      provide: STORED_FILES_REPOSITORY,
      useExisting: DrizzleStoredFilesRepository,
    },
  ],
  exports: [
    DrizzleClient,
    DRIZZLE,
    DYNAMIC_FORMS_REPOSITORIES.dynamicForms,
    STORED_FILES_REPOSITORY,
    DynamicFormsSeeder,
  ],
})
export class SharedDatabaseModule {}
