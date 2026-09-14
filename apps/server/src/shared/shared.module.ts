import { Module } from '@nestjs/common'

import { ConsultationDatabaseModule } from '@/consultation/database/consultation-database.module'
import { FormalizationDatabaseModule } from '@/formalization/database/formalization-database.module'
import { SHARED_PROVIDERS } from '@/shared/constants/shared-providers'
import { SharedDatabaseModule } from '@/shared/database/drizzle/database.module'
import { DynamicFormUsageProvider } from '@/shared/dynamic-form-usage-provider'
import { CommunicationModule } from '@/shared/communication/communication.module'
import { ProvisionModule } from '@/shared/provision/provision.module'
import { SharedRestModule } from '@/shared/rest/rest.module'

@Module({
  imports: [
    ConsultationDatabaseModule,
    FormalizationDatabaseModule,
    ProvisionModule,
    SharedDatabaseModule,
    SharedRestModule,
    CommunicationModule,
  ],
  providers: [
    DynamicFormUsageProvider,
    {
      provide: SHARED_PROVIDERS.dynamicFormUsage,
      useExisting: DynamicFormUsageProvider,
    },
  ],
  exports: [SHARED_PROVIDERS.dynamicFormUsage],
})
export class SharedModule {}
