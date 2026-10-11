import { createTool } from '@mastra/core/tools'
import { Injectable, Logger } from '@nestjs/common'
import { resolve } from 'node:path'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import { z } from 'zod'

import { DocumentValidationStatus } from '@hms/core/document-engine/domain/structures'

import { ExtractImageTool } from '@/document-engine/ai/mastra/tools/extract-image-metadata-tool'
import { suggestionSchema } from '@/document-engine/ai/mastra/schemas'

type PdfTextItem = {
  str: string
}

type PdfPage = Awaited<
  ReturnType<Awaited<ReturnType<typeof getDocument>['promise']>['getPage']>
>

type PdfCanvas = {
  canvas: { toBuffer: (mimeType: string) => Buffer }
  context: unknown
}

type PdfCanvasFactory = {
  create: (width: number, height: number) => PdfCanvas
  destroy: (canvas: PdfCanvas) => void
}

const TARGET_RENDER_SCALE = 2
const MIN_RENDER_SCALE = 0.5
const MAX_RENDER_PIXELS = 16_000_000
const MAX_RENDER_DIMENSION = 8192

const inputSchema = z.object({
  batchId: z.string().uuid(),
  documentFileId: z.string().uuid(),
  storagePath: z.string().min(1),
  originalName: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().min(0),
  contentBase64: z.string(),
  hashSha256: z.string().length(64),
  suggestion: suggestionSchema.optional(),
})

const outputSchema = z.object({
  batchId: z.string().uuid(),
  documentFileId: z.string().uuid(),
  metadata: z.object({
    mimeType: z.string().min(1),
    sizeBytes: z.number().int().min(0),
    hashSha256: z.string().length(64),
    pageCount: z.number().int().min(0),
    textLength: z.number().int().min(0),
    extractedTextFull: z.string(),
  }),
  suggestion: suggestionSchema.optional(),
})

@Injectable()
export class ExtractPdfTool {
  private readonly logger = new Logger(ExtractPdfTool.name)

  readonly function: ReturnType<
    typeof createTool<'extract-pdf-metadata', typeof inputSchema, typeof outputSchema>
  >

  constructor(private readonly extractImageTool: ExtractImageTool) {
    this.function = createTool({
      id: 'extract-pdf-metadata',
      description: 'Extract basic metadata from a PDF document.',
      inputSchema,
      outputSchema,
      strict: true,
      execute: async (input) => {
        const content = Buffer.from(input.contentBase64, 'base64')
        const extracted = await this.extractText(
          content,
          input,
          input.suggestion?.suggestedStatus === DocumentValidationStatus.Duplicate,
        )
        const fullText = extracted.text

        return {
          batchId: input.batchId,
          documentFileId: input.documentFileId,
          metadata: {
            mimeType: input.mimeType,
            sizeBytes: input.sizeBytes,
            hashSha256: input.hashSha256,
            pageCount: extracted.pageCount,
            textLength: fullText.length,
            extractedTextFull: fullText,
          },
          suggestion: extracted.suggestion ?? input.suggestion,
        }
      },
    })
  }

  private async extractText(
    content: Buffer,
    input: z.infer<typeof inputSchema>,
    isDuplicate: boolean,
  ) {
    let loadingTask: ReturnType<typeof getDocument> | undefined
    let pdf: Awaited<ReturnType<typeof getDocument>['promise']> | undefined

    try {
      loadingTask = getDocument({
        data: new Uint8Array(content),
        standardFontDataUrl: this.getStandardFontDataUrl(),
      })
      pdf = await loadingTask.promise

      const pages: string[] = []
      let failureSuggestion:
        | ReturnType<typeof this.buildProcessingFailureSuggestion>
        | undefined

      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        const page = await pdf.getPage(pageNumber)
        try {
          const pageContent = await page.getTextContent()
          const nativeText = this.normalizeNativeText(
            pageContent.items
              .map((item) => this.getTextItemContent(item))
              .filter((text) => text.length > 0)
              .join(' '),
          )

          if (nativeText.length > 0 || isDuplicate) {
            pages.push(nativeText)
            continue
          }

          const image = await this.renderPageAsPng(page, pdf.canvasFactory)
          const extraction = await this.extractImageTool.extractText(
            image.toString('base64'),
            'image/png',
            input.documentFileId,
          )

          if (!extraction.success) {
            failureSuggestion = this.buildProcessingFailureSuggestion(extraction.reason)
            break
          }

          pages.push(extraction.text)
        } catch (error) {
          const reason =
            error instanceof Error && error.message.trim().length > 0
              ? `Falha ao renderizar página ${pageNumber} do PDF: ${error.message.trim().slice(0, 160)}`
              : `Falha ao renderizar página ${pageNumber} do PDF.`
          failureSuggestion = this.buildProcessingFailureSuggestion(reason)
          break
        } finally {
          page.cleanup()
        }
      }

      return {
        pageCount: pdf.numPages,
        text: failureSuggestion ? '' : pages.join('\n\n'),
        suggestion: failureSuggestion,
      }
    } catch (error) {
      const message =
        error instanceof Error && error.message.trim().length > 0
          ? error.message.trim().slice(0, 160)
          : 'erro desconhecido'

      return {
        pageCount: pdf?.numPages ?? 0,
        text: '',
        suggestion: this.buildProcessingFailureSuggestion(
          `Falha ao ler a estrutura do PDF: ${message}`,
        ),
      }
    } finally {
      try {
        if (pdf) {
          await pdf.destroy()
        } else if (loadingTask) {
          await loadingTask.destroy()
        }
      } catch (error) {
        const message =
          error instanceof Error && error.message.trim().length > 0
            ? error.message.trim().slice(0, 160)
            : 'erro desconhecido'
        this.logger.warn(`Falha ao liberar recursos do PDF: ${message}`)
      }
    }
  }

  private buildProcessingFailureSuggestion(reason: string) {
    return {
      suggestedStatus: DocumentValidationStatus.ProcessingFailure,
      confidence: 0,
      confidenceLabel: 'Falha no processamento automático',
      extractedFields: [],
      missingFields: [],
      evidence: [],
      failureReason: reason,
      failureInstruction:
        'Verifique se o arquivo PDF está íntegro e tente processá-lo novamente.',
    }
  }

  private async renderPageAsPng(page: PdfPage, canvasFactory: object) {
    const viewport = page.getViewport({ scale: 1 })
    const scale = Math.min(
      TARGET_RENDER_SCALE,
      Math.sqrt(MAX_RENDER_PIXELS / (viewport.width * viewport.height)),
      MAX_RENDER_DIMENSION / viewport.width,
      MAX_RENDER_DIMENSION / viewport.height,
    )

    if (!Number.isFinite(scale) || scale < MIN_RENDER_SCALE) {
      throw new Error('A página excede o limite seguro de renderização para OCR.')
    }

    const scaledViewport = page.getViewport({ scale })
    const width = Math.ceil(scaledViewport.width)
    const height = Math.ceil(scaledViewport.height)
    const factory = canvasFactory as PdfCanvasFactory
    const surface = factory.create(width, height)

    try {
      await page.render({
        canvas: surface.canvas as never,
        canvasContext: surface.context as never,
        viewport: scaledViewport,
      }).promise

      return surface.canvas.toBuffer('image/png')
    } finally {
      factory.destroy(surface)
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

  private getStandardFontDataUrl() {
    return `${resolve('node_modules/pdfjs-dist/standard_fonts').replace(/\\/g, '/')}/`
  }

  private normalizeNativeText(text: string) {
    return text.replace(/\s+/g, ' ').trim()
  }
}
