import { Module } from '@nestjs/common'

import { DOCUMENT_PRODUCTION_PROVIDERS } from '@/document-production/constants/document-production-providers'
import { DocxProvider } from '@/document-production/provision/docx-provider'
import { FinalDocumentPdfExporter } from '@/document-production/provision/final-document-pdf-exporter'
import { GotenbergDocumentPdfConverter } from '@/document-production/provision/gotenberg-document-pdf-converter'
import { PdfjsDocumentPdfInspector } from '@/document-production/provision/pdfjs-document-pdf-inspector'
import { ProvisionModule } from '@/shared/provision/provision.module'

@Module({
  imports: [ProvisionModule],
  providers: [
    DocxProvider,
    GotenbergDocumentPdfConverter,
    FinalDocumentPdfExporter,
    PdfjsDocumentPdfInspector,
    {
      provide: DOCUMENT_PRODUCTION_PROVIDERS.documentFileExporter,
      useExisting: DocxProvider,
    },
    {
      provide: DOCUMENT_PRODUCTION_PROVIDERS.documentPdfConverter,
      useExisting: GotenbergDocumentPdfConverter,
    },
    {
      provide: DOCUMENT_PRODUCTION_PROVIDERS.finalDocumentFileExporter,
      useExisting: FinalDocumentPdfExporter,
    },
    {
      provide: DOCUMENT_PRODUCTION_PROVIDERS.documentPdfInspector,
      useExisting: PdfjsDocumentPdfInspector,
    },
  ],
  exports: [
    DOCUMENT_PRODUCTION_PROVIDERS.documentFileExporter,
    DOCUMENT_PRODUCTION_PROVIDERS.documentPdfConverter,
    DOCUMENT_PRODUCTION_PROVIDERS.finalDocumentFileExporter,
    DOCUMENT_PRODUCTION_PROVIDERS.documentPdfInspector,
  ],
})
export class DocumentProductionProvisionModule {}
