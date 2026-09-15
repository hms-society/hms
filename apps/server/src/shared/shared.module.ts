import { Module } from '@nestjs/common'

import { ConsultationDatabaseModule } from '@/consultation/database/consultation-database.module'
import { DocumentProductionDatabaseModule } from '@/document-production/database/document-production-database.module'
import { FormalizationDatabaseModule } from '@/formalization/database/formalization-database.module'
import { IdentityDatabaseModule } from '@/identity/database/identity-database.module'
import { IntakeDatabaseModule } from '@/intake/database/intake-database.module'
import { LegalCatalogDatabaseModule } from '@/legal-catalog/database/legal-catalog-database.module'
import { FORMALIZATION_PROVIDERS } from '@/formalization/constants/formalization-providers'
import { SHARED_PROVIDERS } from '@/shared/constants/shared-providers'
import { SharedDatabaseModule } from '@/shared/database/drizzle/database.module'
import { DynamicFormUsageProvider } from '@/shared/dynamic-form-usage-provider'
import { CommunicationModule } from '@/shared/communication/communication.module'
import { ProvisionModule } from '@/shared/provision/provision.module'
import { SharedRestModule } from '@/shared/rest/rest.module'
import { FormalizationSignatureSourceProvider } from '@/shared/formalization-signature-source-provider'
import { FormalizationSourceProvider } from '@/shared/formalization-source-provider'

@Module({
  imports: [
    ConsultationDatabaseModule,
    DocumentProductionDatabaseModule,
    FormalizationDatabaseModule,
    IdentityDatabaseModule,
    IntakeDatabaseModule,
    LegalCatalogDatabaseModule,
    ProvisionModule,
    SharedDatabaseModule,
    SharedRestModule,
    CommunicationModule,
  ],
  providers: [
    DynamicFormUsageProvider,
    FormalizationSignatureSourceProvider,
    FormalizationSourceProvider,
    {
      provide: SHARED_PROVIDERS.dynamicFormUsage,
      useExisting: DynamicFormUsageProvider,
    },
    {
      provide: FORMALIZATION_PROVIDERS.signatureSourceProvider,
      useExisting: FormalizationSignatureSourceProvider,
    },
    {
      provide: FORMALIZATION_PROVIDERS.sourceProvider,
      useExisting: FormalizationSourceProvider,
    },
  ],
  exports: [
    SHARED_PROVIDERS.dynamicFormUsage,
    FORMALIZATION_PROVIDERS.signatureSourceProvider,
    FORMALIZATION_PROVIDERS.sourceProvider,
  ],
})
export class SharedModule {}
