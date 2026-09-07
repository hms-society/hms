import { Injectable } from '@nestjs/common'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import type { FormalizationDocumentPdfInspector } from '@hms/core/formalization/interfaces'
import type { FormalizationDocumentPdfInspection } from '@hms/core/formalization/domain/structures'
import { FormalizationDocumentPdfInspectionError } from '@hms/core/formalization/domain/errors'

@Injectable()
export class PdfJsFormalizationDocumentPdfInspectorProvider
  implements FormalizationDocumentPdfInspector
{
  async inspect(content: Uint8Array): Promise<FormalizationDocumentPdfInspection> {
    try {
      const loadingTask = getDocument({
        data: content,
        disableAutoFetch: true,
        disableFontFace: true,
        useWorkerFetch: false,
      })
      const document = await loadingTask.promise
      const pages: FormalizationDocumentPdfInspection['pages'][number][] = []
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
      throw new FormalizationDocumentPdfInspectionError()
    }
  }
}
