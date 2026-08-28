import { Module } from '@nestjs/common'

import { CommunicationSeeder } from '@/communication/database/communication-seeder'
import { CaseManagementDatabaseModule } from '@/case-management/database'
import { ConsultationDatabaseModule } from '@/consultation/database/consultation-database.module'
import { DocumentsModule } from '@/document-engine/database/documents.module'
import { DocumentProductionDatabaseModule } from '@/document-production/database/document-production-database.module'
import { AuthModule } from '@/identity/auth.module'
import { IdentityDatabaseModule } from '@/identity/database/identity-database.module'
import { IntakeDatabaseModule } from '@/intake/database/intake-database.module'
import { FormalizationDatabaseModule } from '@/formalization/database/formalization-database.module'
import { LegalCatalogDatabaseModule } from '@/legal-catalog/database/legal-catalog-database.module'
import { SchedulingDatabaseModule } from '@/scheduling/database/scheduling-database.module'
import { SharedDatabaseModule } from '@/shared/database/drizzle/database.module'
import { ProvisionModule } from '@/shared/provision/provision.module'

@Module({
  imports: [
    CaseManagementDatabaseModule,
    AuthModule,
    ConsultationDatabaseModule,
    DocumentsModule,
    DocumentProductionDatabaseModule,
    IdentityDatabaseModule,
    IntakeDatabaseModule,
    FormalizationDatabaseModule,
    LegalCatalogDatabaseModule,
    ProvisionModule,
    SchedulingDatabaseModule,
    SharedDatabaseModule,
  ],
  providers: [CommunicationSeeder],
  exports: [CommunicationSeeder],
})
export class SeedModule {}
