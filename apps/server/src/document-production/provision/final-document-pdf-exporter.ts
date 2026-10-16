import type {
  DocumentFileExporter,
  DocumentPdfConverter,
} from '@hms/core/document-production/interfaces'
import { Inject, Injectable } from '@nestjs/common'
import { randomUUID } from 'node:crypto'

import { DOCUMENT_PRODUCTION_PROVIDERS } from '@/document-production/constants/document-production-providers'
import { DocxProvider } from '@/document-production/provision/docx-provider'

@Injectable()
export class FinalDocumentPdfExporter implements DocumentFileExporter {
  constructor(
    private readonly docxProvider: DocxProvider,
    @Inject(DOCUMENT_PRODUCTION_PROVIDERS.documentPdfConverter)
    private readonly pdfConverter: DocumentPdfConverter,
  ) {}

  async export(input: Parameters<DocumentFileExporter['export']>[0]) {
    const docx = await this.docxProvider.export(input)
    const pdf = await this.pdfConverter.convert({
      fileName: `${input.title}.docx`,
      contentType:
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      content: docx.content,
      traceId: randomUUID(),
    })

    return {
      content: pdf.content,
      contentType: pdf.contentType,
      extension: 'pdf' as const,
    }
  }
}
