import { Module } from '@nestjs/common'

import { DOCUMENT_PRODUCTION_PROVIDERS } from '@/document-production/constants/document-production-providers'
import { DocxProvider } from '@/document-production/provision/docx-provider'

@Module({
  providers: [
    DocxProvider,
    {
      provide: DOCUMENT_PRODUCTION_PROVIDERS.documentFileExporter,
      useExisting: DocxProvider,
    },
  ],
  exports: [DOCUMENT_PRODUCTION_PROVIDERS.documentFileExporter],
})
export class DocumentProductionProvisionModule {}
