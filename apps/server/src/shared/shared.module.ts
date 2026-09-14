import { Module } from '@nestjs/common'

import { ConsultationDatabaseModule } from '@/consultation/database/consultation-database.module'
import { DocumentProductionDatabaseModule } from '@/document-production/database/document-production-database.module'
import { FormalizationDatabaseModule } from '@/formalization/database/formalization-database.module'
import { IdentityDatabaseModule } from '@/identity/database/identity-database.module'
import { IntakeDatabaseModule } from '@/intake/database/intake-database.module'
import { SHARED_PROVIDERS } from '@/shared/constants/shared-providers'
import { SharedDatabaseModule } from '@/shared/database/drizzle/database.module'
import { DynamicFormUsageProvider } from '@/shared/dynamic-form-usage-provider'
import { FormalizationSignatureSourceProvider } from '@/shared/formalization-signature-source-provider'
import { FormalizationSourceProvider } from '@/shared/formalization-source-provider'
import { CommunicationModule } from '@/shared/communication/communication.module'
import { ProvisionModule } from '@/shared/provision/provision.module'
import { SharedRestModule } from '@/shared/rest/rest.module'

@Module({
  imports: [
    ConsultationDatabaseModule,
    DocumentProductionDatabaseModule,
    FormalizationDatabaseModule,
    IdentityDatabaseModule,
    IntakeDatabaseModule,
    ProvisionModule,
    SharedDatabaseModule,
    SharedRestModule,
    CommunicationModule,
  ],
  providers: [
    DynamicFormUsageProvider,
    FormalizationSourceProvider,
    FormalizationSignatureSourceProvider,
    {
      provide: SHARED_PROVIDERS.dynamicFormUsage,
      useExisting: DynamicFormUsageProvider,
    },
    {
      provide: SHARED_PROVIDERS.formalizationSource,
      useExisting: FormalizationSourceProvider,
    },
    {
      provide: SHARED_PROVIDERS.formalizationSignatureSource,
      useExisting: FormalizationSignatureSourceProvider,
    },
  ],
  exports: [
    SHARED_PROVIDERS.dynamicFormUsage,
    SHARED_PROVIDERS.formalizationSource,
    SHARED_PROVIDERS.formalizationSignatureSource,
  ],
})
export class SharedModule {}
