import { Module } from '@nestjs/common'

import { DocumentProductionModule } from '@/document-production/document-production.module'
import { FORMALIZATION_PROVIDERS } from '@/formalization/constants/formalization-providers'
import {
  FormalizationSignatureSourceReader,
  FormalizationSignatureSecretHasher,
  FormalizationSignatureSecretVerifier,
  FormalizationSignatureSecretGenerator,
  FormalizationSignatureOtpMacProvider,
  FormalizationSensitivePayloadCipherProvider,
  FormalizationSignatureDocumentContentReader,
  GotenbergDocumentPdfConverterProvider,
  PdfJsFormalizationDocumentPdfInspectorProvider,
  DocumensoSignatureProvider,
} from '@/formalization/provision'
import { IdentityModule } from '@/identity/identity.module'
import { ProvisionModule } from '@/shared/provision/provision.module'

@Module({
  imports: [DocumentProductionModule, IdentityModule, ProvisionModule],
  providers: [
    FormalizationSignatureSourceReader,
    FormalizationSignatureSecretHasher,
    FormalizationSignatureSecretVerifier,
    FormalizationSignatureSecretGenerator,
    FormalizationSignatureOtpMacProvider,
    FormalizationSensitivePayloadCipherProvider,
    FormalizationSignatureDocumentContentReader,
    GotenbergDocumentPdfConverterProvider,
    PdfJsFormalizationDocumentPdfInspectorProvider,
    DocumensoSignatureProvider,
    {
      provide: FORMALIZATION_PROVIDERS.signatureProvider,
      useExisting: DocumensoSignatureProvider,
    },
    {
      provide: FORMALIZATION_PROVIDERS.signatureSecretGenerator,
      useExisting: FormalizationSignatureSecretGenerator,
    },
    {
      provide: FORMALIZATION_PROVIDERS.signatureSourceReader,
      useExisting: FormalizationSignatureSourceReader,
    },
    {
      provide: FORMALIZATION_PROVIDERS.documentPdfConverter,
      useExisting: GotenbergDocumentPdfConverterProvider,
    },
    {
      provide: FORMALIZATION_PROVIDERS.documentPdfInspector,
      useExisting: PdfJsFormalizationDocumentPdfInspectorProvider,
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
      provide: FORMALIZATION_PROVIDERS.signatureDocumentContentReader,
      useExisting: FormalizationSignatureDocumentContentReader,
    },
  ],
  exports: [
    FORMALIZATION_PROVIDERS.signatureSourceReader,
    FORMALIZATION_PROVIDERS.documentPdfConverter,
    FORMALIZATION_PROVIDERS.documentPdfInspector,
    FORMALIZATION_PROVIDERS.signatureSecretHasher,
    FORMALIZATION_PROVIDERS.signatureSecretVerifier,
    FORMALIZATION_PROVIDERS.signatureOtpMacProvider,
    FORMALIZATION_PROVIDERS.sensitivePayloadCipher,
    FORMALIZATION_PROVIDERS.signatureDocumentContentReader,
    FORMALIZATION_PROVIDERS.signatureProvider,
    FORMALIZATION_PROVIDERS.signatureSecretGenerator,
  ],
})
export class FormalizationProvisionModule {}
