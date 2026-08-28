import { Module } from '@nestjs/common'

import { SharedDatabaseModule } from '@/shared/database/drizzle/database.module'

import { DOCUMENT_ENGINE } from './drizzle/constants/documents-repositories'
import { DrizzleDocumentBatchMapper } from './drizzle/mappers/drizzle-document-batch-mapper'
import { DrizzleDocumentBatchesRepository } from './drizzle/repositories/document-batches-repository'
import { DrizzleDailyCountersRepository } from './drizzle/repositories/daily-counters-repository'
import { DrizzleDocumentValidationLogsRepository } from './drizzle/repositories/drizzle-document-validation-logs-repository'
import { DrizzleDocumentValidationsRepository } from './drizzle/repositories/drizzle-document-validations-repository'

@Module({
  imports: [SharedDatabaseModule],
  providers: [
    DrizzleDocumentBatchMapper,
    DrizzleDailyCountersRepository,
    DrizzleDocumentBatchesRepository,
    DrizzleDocumentValidationsRepository,
    DrizzleDocumentValidationLogsRepository,
    {
      provide: DOCUMENT_ENGINE.dailyCounters,
      useExisting: DrizzleDailyCountersRepository,
    },
    {
      provide: DOCUMENT_ENGINE.documentBatches,
      useExisting: DrizzleDocumentBatchesRepository,
    },
    {
      provide: DOCUMENT_ENGINE.documentValidations,
      useExisting: DrizzleDocumentValidationsRepository,
    },
    {
      provide: DOCUMENT_ENGINE.documentValidationLogs,
      useExisting: DrizzleDocumentValidationLogsRepository,
    },
  ],
  exports: [
    DOCUMENT_ENGINE.dailyCounters,
    DOCUMENT_ENGINE.documentBatches,
    DOCUMENT_ENGINE.documentValidations,
    DOCUMENT_ENGINE.documentValidationLogs,
  ],
})
export class DocumentsDatabaseModule {}
