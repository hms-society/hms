import { Module } from '@nestjs/common'

import { DocumentProductionModule } from '@/document-production/document-production.module'
import { FORMALIZATION_PROVIDERS } from '@/formalization/constants/formalization-providers'
import {
  FormalizationSignatureSourceReader,
  GotenbergDocumentPdfConverterProvider,
  PdfJsFormalizationDocumentPdfInspectorProvider,
} from '@/formalization/provision'
import { IdentityModule } from '@/identity/identity.module'
import { ProvisionModule } from '@/shared/provision/provision.module'

@Module({
  imports: [DocumentProductionModule, IdentityModule, ProvisionModule],
  providers: [
    FormalizationSignatureSourceReader,
    GotenbergDocumentPdfConverterProvider,
    PdfJsFormalizationDocumentPdfInspectorProvider,
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
  ],
  exports: [
    FORMALIZATION_PROVIDERS.signatureSourceReader,
    FORMALIZATION_PROVIDERS.documentPdfConverter,
    FORMALIZATION_PROVIDERS.documentPdfInspector,
  ],
})
export class FormalizationProvisionModule {}
