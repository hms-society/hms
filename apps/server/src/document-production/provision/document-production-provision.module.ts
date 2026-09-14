import { Module } from '@nestjs/common'

import { DOCUMENT_PRODUCTION_PROVIDERS } from '@/document-production/constants/document-production-providers'
import { DocxProvider } from '@/document-production/provision/docx-provider'
import { GotenbergDocumentPdfConverterProvider } from '@/document-production/provision/gotenberg-document-pdf-converter-provider'
import { PdfJsDocumentPdfInspectorProvider } from '@/document-production/provision/pdf-js-document-pdf-inspector-provider'
import { DocumentPdfFreezeProvider } from '@/document-production/provision/document-pdf-freeze-provider'
import { DocumentProductionDatabaseModule } from '@/document-production/database/document-production-database.module'
import { SharedDatabaseModule } from '@/shared/database/drizzle/database.module'
import { ProvisionModule } from '@/shared/provision/provision.module'

@Module({
  imports: [DocumentProductionDatabaseModule, SharedDatabaseModule, ProvisionModule],
  providers: [
    DocxProvider,
    GotenbergDocumentPdfConverterProvider,
    PdfJsDocumentPdfInspectorProvider,
    DocumentPdfFreezeProvider,
    {
      provide: DOCUMENT_PRODUCTION_PROVIDERS.documentFileExporter,
      useExisting: DocxProvider,
    },
    {
      provide: DOCUMENT_PRODUCTION_PROVIDERS.documentPdfConverter,
      useExisting: GotenbergDocumentPdfConverterProvider,
    },
    {
      provide: DOCUMENT_PRODUCTION_PROVIDERS.documentPdfInspector,
      useExisting: PdfJsDocumentPdfInspectorProvider,
    },
    {
      provide: DOCUMENT_PRODUCTION_PROVIDERS.documentPdfFreezeService,
      useExisting: DocumentPdfFreezeProvider,
    },
  ],
  exports: [
    DOCUMENT_PRODUCTION_PROVIDERS.documentFileExporter,
    DOCUMENT_PRODUCTION_PROVIDERS.documentPdfFreezeService,
  ],
})
export class DocumentProductionProvisionModule {}
