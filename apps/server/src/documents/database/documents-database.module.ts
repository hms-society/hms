import { Module } from '@nestjs/common'
import { SharedDatabaseModule } from '@/shared/database/drizzle/database.module'
import { ProvisionModule } from '@/shared/provision/provision.module'
import { IdentityDatabaseModule } from '@/identity/database/identity-database.module'
import { DOCUMENTS_REPOSITORIES } from './drizzle/constants/documents-repositories'
import { DrizzleDocumentBatchMapper } from './drizzle/mappers/drizzle-document-batch-mapper'
import { DrizzleDailyCountersRepository } from './drizzle/repositories/drizzle-daily-counters-repository'
import { DrizzleDocumentBatchesRepository } from './drizzle/repositories/drizzle-document-batches-repository'
import { DocumentsSeeder } from './documents-seeder'
import { CreateDocumentBatchUseCase } from '@hms/core/documents/use-cases/create-document-batch-use-case.js'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'

@Module({
  imports: [
    SharedDatabaseModule, 
    ProvisionModule, 
    IdentityDatabaseModule 
  ],
  providers: [
    DrizzleDocumentBatchMapper,
    DrizzleDailyCountersRepository,
    DrizzleDocumentBatchesRepository,
    {
      provide: DOCUMENTS_REPOSITORIES.dailyCounters,
      useExisting: DrizzleDailyCountersRepository,
    },
    {
      provide: DOCUMENTS_REPOSITORIES.documentBatches,
      useExisting: DrizzleDocumentBatchesRepository,
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
        DOCUMENTS_REPOSITORIES.documentBatches,
        DOCUMENTS_REPOSITORIES.dailyCounters,
        IDENTITY_REPOSITORIES.clients,
        DatetimeProvider,
      ],
    },
    DocumentsSeeder,
  ],
  exports: [
    DOCUMENTS_REPOSITORIES.dailyCounters,
    DOCUMENTS_REPOSITORIES.documentBatches,
    CreateDocumentBatchUseCase,
    DocumentsSeeder,
  ],
})
export class DocumentsDatabaseModule {}