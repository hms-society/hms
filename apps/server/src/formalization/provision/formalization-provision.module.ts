import { Module } from '@nestjs/common'

import { DocumentProductionModule } from '@/document-production/document-production.module'
import { FORMALIZATION_PROVIDERS } from '@/formalization/constants/formalization-providers'
import { DrizzleFormalizationSignatureMapper } from '@/formalization/database/drizzle/mappers'
import { DrizzleFormalizationSignatureConfigurationRepository } from '@/formalization/database/drizzle/repositories'
import {
  FormalizationSignatureSecretHasher,
  FormalizationSignatureSecretVerifier,
  FormalizationSignatureSecretGenerator,
  FormalizationSignatureOtpMacProvider,
  FormalizationSensitivePayloadCipherProvider,
  FormalizationSignatureDocumentContentProvider,
  DocumensoSignatureProvider,
} from '@/formalization/provision'
import { IdentityModule } from '@/identity/identity.module'
import { ProvisionModule } from '@/shared/provision/provision.module'
import { SharedDatabaseModule } from '@/shared/database/drizzle/database.module'
import { IntakeModule } from '@/intake/intake.module'

@Module({
  imports: [
    DocumentProductionModule,
    IntakeModule,
    IdentityModule,
    ProvisionModule,
    SharedDatabaseModule,
  ],
  providers: [
    FormalizationSignatureSecretHasher,
    FormalizationSignatureSecretVerifier,
    FormalizationSignatureSecretGenerator,
    FormalizationSignatureOtpMacProvider,
    FormalizationSensitivePayloadCipherProvider,
    FormalizationSignatureDocumentContentProvider,
    DocumensoSignatureProvider,
    DrizzleFormalizationSignatureMapper,
    DrizzleFormalizationSignatureConfigurationRepository,
    {
      provide: FORMALIZATION_PROVIDERS.signatureProvider,
      useExisting: DocumensoSignatureProvider,
    },
    {
      provide: FORMALIZATION_PROVIDERS.signatureSecretGenerator,
      useExisting: FormalizationSignatureSecretGenerator,
    },
    {
      provide: FORMALIZATION_PROVIDERS.signatureSecretHasher,
      useExisting: FormalizationSignatureSecretHasher,
    },
    {
      provide: FORMALIZATION_PROVIDERS.signatureSecretVerifier,
      useExisting: FormalizationSignatureSecretVerifier,
    },
    {
      provide: FORMALIZATION_PROVIDERS.signatureOtpMacProvider,
      useExisting: FormalizationSignatureOtpMacProvider,
    },
    {
      provide: FORMALIZATION_PROVIDERS.sensitivePayloadCipher,
      useExisting: FormalizationSensitivePayloadCipherProvider,
    },
    {
      provide: FORMALIZATION_PROVIDERS.signatureDocumentContentProvider,
      useExisting: FormalizationSignatureDocumentContentProvider,
    },
    {
      provide: FORMALIZATION_PROVIDERS.signatureConfigurationRepository,
      useExisting: DrizzleFormalizationSignatureConfigurationRepository,
    },
  ],
  exports: [
    FORMALIZATION_PROVIDERS.signatureSecretHasher,
    FORMALIZATION_PROVIDERS.signatureSecretVerifier,
    FORMALIZATION_PROVIDERS.signatureOtpMacProvider,
    FORMALIZATION_PROVIDERS.sensitivePayloadCipher,
    FORMALIZATION_PROVIDERS.signatureDocumentContentProvider,
    FORMALIZATION_PROVIDERS.signatureProvider,
    FORMALIZATION_PROVIDERS.signatureSecretGenerator,
    FORMALIZATION_PROVIDERS.signatureConfigurationRepository,
  ],
})
export class FormalizationProvisionModule {}
