import { Module } from '@nestjs/common'

import { FORMALIZATION_REPOSITORIES } from '@/formalization/constants/formalization-repositories'
import { FORMALIZATION_PROVIDERS } from '@/formalization/constants/formalization-providers'
import { FormalizationSeeder } from '@/formalization/database/formalization-seeder'
import { DrizzleFormalizationMapper } from '@/formalization/database/drizzle/mappers'
import { DrizzleFormalizationsRepository } from '@/formalization/database/drizzle/repositories'
import { DrizzleFormalizationSignatureConfigurationRepository } from '@/formalization/database/drizzle/repositories'
import { DrizzleFormalizationSignatureMapper } from '@/formalization/database/drizzle/mappers'
import { SharedDatabaseModule } from '@/shared/database/drizzle/database.module'
import { FormalizationProvisionModule } from '@/formalization/provision/formalization-provision.module'

@Module({
  imports: [SharedDatabaseModule, FormalizationProvisionModule],
  providers: [
    DrizzleFormalizationMapper,
    DrizzleFormalizationsRepository,
    DrizzleFormalizationSignatureMapper,
    DrizzleFormalizationSignatureConfigurationRepository,
    FormalizationSeeder,
    {
      provide: FORMALIZATION_REPOSITORIES.formalizations,
      useExisting: DrizzleFormalizationsRepository,
    },
    {
      provide: FORMALIZATION_PROVIDERS.signatureConfigurationRepository,
      useExisting: DrizzleFormalizationSignatureConfigurationRepository,
    },
  ],
  exports: [
    FORMALIZATION_REPOSITORIES.formalizations,
    FormalizationSeeder,
    FORMALIZATION_PROVIDERS.signatureConfigurationRepository,
  ],
})
export class FormalizationDatabaseModule {}
