import { Injectable } from '@nestjs/common'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import type { DocumentPdfInspector } from '@hms/core/document-production/interfaces'
import { DocumentPdfInspectionError } from '@hms/core/document-production/domain/errors'

@Injectable()
export class PdfJsDocumentPdfInspectorProvider implements DocumentPdfInspector {
  async inspect(content: Uint8Array) {
    try {
      const loadingTask = getDocument({
        data: content,
        disableAutoFetch: true,
        disableFontFace: true,
        useWorkerFetch: false,
      })
      const document = await loadingTask.promise
      const pages: { page: number; width: number; height: number }[] = []
      for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
        const page = await document.getPage(pageNumber)
        const viewport = page.getViewport({ scale: 1 })
        pages.push({ page: pageNumber, width: viewport.width, height: viewport.height })
        page.cleanup()
      }
      await document.cleanup()
      await loadingTask.destroy()
      if (pages.length === 0) throw new Error('empty document')
      return { pageCount: pages.length, pages }
    } catch {
      throw new DocumentPdfInspectionError()
    }
  }
}
