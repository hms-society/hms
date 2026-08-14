import { Module } from '@nestjs/common'

import { DOCUMENT_PRODUCTION_REPOSITORIES } from '@/document-production/constants/document-production-repositories'
import { DrizzleDocumentSpecificationMapper } from '@/document-production/database/drizzle/mappers'
import { DrizzleDocumentSpecificationsRepository } from '@/document-production/database/drizzle/repositories'
import { SharedDatabaseModule } from '@/shared/database/drizzle/database.module'

@Module({
  imports: [SharedDatabaseModule],
  providers: [
    DrizzleDocumentSpecificationMapper,
    DrizzleDocumentSpecificationsRepository,
    {
      provide: DOCUMENT_PRODUCTION_REPOSITORIES.specifications,
      useExisting: DrizzleDocumentSpecificationsRepository,
    },
  ],
  exports: [DOCUMENT_PRODUCTION_REPOSITORIES.specifications],
})
export class DocumentProductionDatabaseModule {}
