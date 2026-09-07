import { Module } from '@nestjs/common'

import { ConsultationDatabaseModule } from '@/consultation/database/consultation-database.module'
import { DocumentProductionDatabaseModule } from '@/document-production/database/document-production-database.module'
import { DocumentProductionProvisionModule } from '@/document-production/provision/document-production-provision.module'
import { FormalizationDatabaseModule } from '@/formalization/database'
import { FormalizationMessagingModule } from '@/formalization/messaging/formalization-messaging.module'
import { FormalizationProvisionModule } from '@/formalization/provision/formalization-provision.module'
import { ServerFormalizationSourceReader } from '@/formalization/provision'
import { FORMALIZATION_PROVIDERS } from '@/formalization/constants/formalization-providers'
import { IdentityModule } from '@/identity/identity.module'
import { IntakeDatabaseModule } from '@/intake/database/intake-database.module'
import { SharedDatabaseModule } from '@/shared/database/drizzle/database.module'
import { SharedMessagingModule } from '@/shared/messaging/shared-messaging.module'
import { ProvisionModule } from '@/shared/provision/provision.module'

@Module({
  imports: [
    IdentityModule,
    IntakeDatabaseModule,
    ConsultationDatabaseModule,
    DocumentProductionDatabaseModule,
    DocumentProductionProvisionModule,
    FormalizationDatabaseModule,
    FormalizationMessagingModule,
    FormalizationProvisionModule,
    SharedDatabaseModule,
    SharedMessagingModule,
    ProvisionModule,
  ],
  providers: [
    ServerFormalizationSourceReader,
    {
      provide: FORMALIZATION_PROVIDERS.signatureSourceReader,
      useExisting: ServerFormalizationSourceReader,
    },
  ],
  exports: [FormalizationMessagingModule],
})
export class FormalizationModule {}
