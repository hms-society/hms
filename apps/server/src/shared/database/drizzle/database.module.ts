import { Module } from '@nestjs/common'

import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { databaseProviders, DRIZZLE } from '@/shared/database/drizzle/database.provider'
import { DYNAMIC_FORMS_REPOSITORIES } from '@/shared/constants/dynamic-forms-repositories'
import { AI_SUGGESTIONS_REPOSITORIES } from '@/shared/constants/ai-suggestions-repositories'
import { DynamicFormsSeeder } from '@/shared/database/dynamic-forms-seeder'
import { DrizzleDynamicFormMapper } from '@/shared/database/drizzle/mappers'
import { DrizzleDynamicFormsRepository } from '@/shared/database/drizzle/repositories'
import { DrizzleAiSuggestionsRepository } from '@/shared/database/drizzle/repositories/drizzle-ai-suggestions-repository'
import { DrizzleAuditLogsRepository } from '@/shared/database/drizzle/repositories/drizzle-audit-logs-repository'

@Module({
  providers: [
    DrizzleClient,
    ...databaseProviders,
    DrizzleDynamicFormMapper,
    DrizzleDynamicFormsRepository,
    DrizzleAuditLogsRepository,
    DrizzleAiSuggestionsRepository,
    DynamicFormsSeeder,
    {
      provide: DYNAMIC_FORMS_REPOSITORIES.dynamicForms,
      useExisting: DrizzleDynamicFormsRepository,
    },
    {
      provide: AI_SUGGESTIONS_REPOSITORIES.aiSuggestions,
      useExisting: DrizzleAiSuggestionsRepository,
    },
  ],
  exports: [
    DrizzleClient,
    DRIZZLE,
    DYNAMIC_FORMS_REPOSITORIES.dynamicForms,
    DrizzleAuditLogsRepository,
    AI_SUGGESTIONS_REPOSITORIES.aiSuggestions,
    DynamicFormsSeeder,
  ],
})
export class SharedDatabaseModule {}
