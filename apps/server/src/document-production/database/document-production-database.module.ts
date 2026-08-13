import { Module } from '@nestjs/common'

import { DOCUMENT_PRODUCTION_REPOSITORIES } from '@/document-production/constants/document-production-repositories'
import { DocumentProductionSeeder } from '@/document-production/database/document-production-seeder'
import {
  DrizzleDocumentGenerationMapper,
  DrizzleDocumentMapper,
  DrizzleDocumentPackageMapper,
  DrizzleDocumentSpecificationMapper,
  DrizzleDocumentVersionMapper,
  DrizzlePackageDocumentMapper,
} from '@/document-production/database/drizzle/mappers'
import {
  DrizzleDocumentGenerationsRepository,
  DrizzleDocumentsRepository,
  DrizzleDocumentPackagesRepository,
  DrizzleDocumentSpecificationsRepository,
  DrizzleDocumentVersionsRepository,
  DrizzlePackageDocumentsRepository,
} from '@/document-production/database/drizzle/repositories'
import { SharedDatabaseModule } from '@/shared/database/drizzle/database.module'

@Module({
  imports: [SharedDatabaseModule],
  providers: [
    DrizzleDocumentGenerationMapper,
    DrizzleDocumentMapper,
    DrizzleDocumentPackageMapper,
    DrizzleDocumentSpecificationMapper,
    DrizzleDocumentVersionMapper,
    DrizzlePackageDocumentMapper,
    DrizzleDocumentGenerationsRepository,
    DrizzleDocumentsRepository,
    DrizzleDocumentPackagesRepository,
    DrizzleDocumentSpecificationsRepository,
    DrizzleDocumentVersionsRepository,
    DrizzlePackageDocumentsRepository,
    DocumentProductionSeeder,
    {
      provide: DOCUMENT_PRODUCTION_REPOSITORIES.generations,
      useExisting: DrizzleDocumentGenerationsRepository,
    },
    {
      provide: DOCUMENT_PRODUCTION_REPOSITORIES.specifications,
      useExisting: DrizzleDocumentSpecificationsRepository,
    },
    {
      provide: DOCUMENT_PRODUCTION_REPOSITORIES.versions,
      useExisting: DrizzleDocumentVersionsRepository,
    },
    {
      provide: DOCUMENT_PRODUCTION_REPOSITORIES.documents,
      useExisting: DrizzleDocumentsRepository,
    },
    {
      provide: DOCUMENT_PRODUCTION_REPOSITORIES.documentPackages,
      useExisting: DrizzleDocumentPackagesRepository,
    },
    {
      provide: DOCUMENT_PRODUCTION_REPOSITORIES.packageDocuments,
      useExisting: DrizzlePackageDocumentsRepository,
    },
  ],
  exports: [
    DOCUMENT_PRODUCTION_REPOSITORIES.generations,
    DOCUMENT_PRODUCTION_REPOSITORIES.specifications,
    DOCUMENT_PRODUCTION_REPOSITORIES.versions,
    DOCUMENT_PRODUCTION_REPOSITORIES.documents,
    DOCUMENT_PRODUCTION_REPOSITORIES.documentPackages,
    DOCUMENT_PRODUCTION_REPOSITORIES.packageDocuments,
    DocumentProductionSeeder,
  ],
})
export class DocumentProductionDatabaseModule {}
