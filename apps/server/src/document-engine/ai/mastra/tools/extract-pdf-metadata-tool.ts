import { createTool } from '@mastra/core/tools'
import { Injectable } from '@nestjs/common'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import { z } from 'zod'

type PdfTextItem = {
  str: string
}

const inputSchema = z.object({
  batchId: z.string().uuid(),
  documentFileId: z.string().uuid(),
  storagePath: z.string().min(1),
  originalName: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().min(0),
  contentBase64: z.string(),
  hashSha256: z.string().length(64),
})

const outputSchema = z.object({
  documentFileId: z.string().uuid(),
  metadata: z.object({
    mimeType: z.string().min(1),
    sizeBytes: z.number().int().min(0),
    hashSha256: z.string().length(64),
    pageCount: z.number().int().min(0),
    textLength: z.number().int().min(0),
    extractedTextFull: z.string(),
  }),
})

@Injectable()
export class ExtractPdfTool {
  readonly function: ReturnType<
    typeof createTool<'extract-pdf-metadata', typeof inputSchema, typeof outputSchema>
  >

  constructor() {
    this.function = createTool({
      id: 'extract-pdf-metadata',
      description: 'Extract basic metadata from a PDF document.',
      inputSchema,
      outputSchema,
      strict: true,
      execute: async (input) => {
        const content = Buffer.from(input.contentBase64, 'base64')
        const extracted = await this.extractText(content)
        const fullText = this.normalizeText(extracted.text)

        return {
          documentFileId: input.documentFileId,
          metadata: {
            mimeType: input.mimeType,
            sizeBytes: input.sizeBytes,
            hashSha256: input.hashSha256,
            pageCount: extracted.pageCount,
            textLength: fullText.length,
            extractedTextFull: fullText,
          },
        }
      },
    })
  }

  private async extractText(content: Buffer) {
    const loadingTask = getDocument({
      data: new Uint8Array(content),
    })
    const pdf = await loadingTask.promise

    try {
      const pages: string[] = []

      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        const page = await pdf.getPage(pageNumber)
        const pageContent = await page.getTextContent()
        const pageText = pageContent.items
          .map((item) => this.getTextItemContent(item))
          .filter((text) => text.length > 0)
          .join(' ')

        pages.push(pageText)
        page.cleanup()
      }

      return {
        pageCount: pdf.numPages,
        text: pages.join('\n\n'),
      }
    } finally {
      await pdf.destroy()
    }
  }

  private getTextItemContent(item: unknown) {
    if (this.isTextItem(item)) {
      return item.str.trim()
    }

    return ''
  }

  private isTextItem(item: unknown): item is PdfTextItem {
    return typeof item === 'object' && item !== null && 'str' in item
  }

  private normalizeText(text: string) {
    return text
      .replace(/[^\S\r\n]+/g, ' ')
      .replace(/\s*\n\s*/g, '\n')
      .replace(/\s+/g, ' ')
      .trim()
  }
}
