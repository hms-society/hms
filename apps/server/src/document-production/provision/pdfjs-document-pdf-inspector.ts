import type { DocumentPdfInspector } from '@hms/core/document-production/interfaces'
import { DocumentPdfInspectionError } from '@hms/core/document-production/domain/errors'
import type { DocumentPdfPage } from '@hms/core/document-production/domain/structures'
import { Injectable } from '@nestjs/common'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'

@Injectable()
export class PdfjsDocumentPdfInspector implements DocumentPdfInspector {
  async inspect(content: Uint8Array) {
    let document: Awaited<ReturnType<typeof getDocument>['promise']> | undefined
    try {
      document = await getDocument({ data: content.slice() }).promise
      const pages: DocumentPdfPage[] = []
      for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
        const page = await document.getPage(pageNumber)
        const viewport = page.getViewport({ scale: 1 })
        pages.push({
          page: pageNumber,
          width: viewport.width,
          height: viewport.height,
        })
        page.cleanup()
      }

      return { pageCount: document.numPages, pages }
    } catch (error) {
      throw new DocumentPdfInspectionError(
        error instanceof Error ? error.message : undefined,
      )
    } finally {
      await document?.destroy()
    }
  }
}
