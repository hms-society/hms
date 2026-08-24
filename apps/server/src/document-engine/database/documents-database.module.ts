import { Module } from '@nestjs/common'
import { CreateDocumentBatchUseCase } from '@hms/core/document-engine/use-cases'

import { IdentityDatabaseModule } from '@/identity/database/identity-database.module'
import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import { SharedDatabaseModule } from '@/shared/database/drizzle/database.module'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { ProvisionModule } from '@/shared/provision/provision.module'

import { DOCUMENT_ENGINE } from './drizzle/constants/documents-repositories'
import { DrizzleDocumentBatchMapper } from './drizzle/mappers/drizzle-document-batch-mapper'
import { DrizzleDocumentBatchesRepository } from './drizzle/repositories/document-batches-repository'
import { DrizzleDailyCountersRepository } from './drizzle/repositories/daily-counters-repository'
import { DrizzleDocumentValidationLogsRepository } from './drizzle/repositories/drizzle-document-validation-logs-repository'
import { DrizzleDocumentValidationsRepository } from './drizzle/repositories/drizzle-document-validations-repository'
import { DocumentsSeeder } from './documents-seeder'
import { RealDocumentsSeeder } from './real-documents-seeder'

@Module({
  imports: [SharedDatabaseModule, ProvisionModule, IdentityDatabaseModule],
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
    {
      provide: CreateDocumentBatchUseCase,
      useFactory: (
        documentBatchesRepo: any,
        dailyCountersRepo: any,
        clientsRepo: any,
        datetimeProvider: DatetimeProvider,
      ) => {
        return new CreateDocumentBatchUseCase(
          documentBatchesRepo,
          dailyCountersRepo,
          clientsRepo,
          datetimeProvider,
        )
      },
      inject: [
        DOCUMENT_ENGINE.documentBatches,
        DOCUMENT_ENGINE.dailyCounters,
        IDENTITY_REPOSITORIES.clients,
        DatetimeProvider,
      ],
    },
    DocumentsSeeder,
    RealDocumentsSeeder,
  ],
  exports: [
    DOCUMENT_ENGINE.dailyCounters,
    DOCUMENT_ENGINE.documentBatches,
    DOCUMENT_ENGINE.documentValidations,
    DOCUMENT_ENGINE.documentValidationLogs,
    CreateDocumentBatchUseCase,
    DocumentsSeeder,
    RealDocumentsSeeder,
  ],
})
export class DocumentsDatabaseModule {}
