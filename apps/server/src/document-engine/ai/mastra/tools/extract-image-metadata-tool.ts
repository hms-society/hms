import { createTool } from '@mastra/core/tools'
import { Injectable } from '@nestjs/common'
import { AppError } from '@hms/core/shared/domain/errors'
import { z } from 'zod'

import { DocumentImageAnalyzerAgent } from '@/document-engine/ai/mastra/agents'

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
    textLength: z.number().int().min(0),
    extractedTextFull: z.string(),
  }),
})

@Injectable()
export class ExtractImageTool {
  readonly function: ReturnType<
    typeof createTool<'extract-image-metadata', typeof inputSchema, typeof outputSchema>
  >

  constructor(private readonly imageAnalyzerAgent: DocumentImageAnalyzerAgent) {
    this.function = createTool({
      id: 'extract-image-metadata',
      description: 'Extract text from an image document with a local vision model.',
      inputSchema,
      outputSchema,
      strict: true,
      execute: async (input) => {
        const extractedTextFull = await this.extractText(
          input.contentBase64,
          input.mimeType,
        )

        return {
          documentFileId: input.documentFileId,
          metadata: {
            mimeType: input.mimeType,
            sizeBytes: input.sizeBytes,
            hashSha256: input.hashSha256,
            textLength: extractedTextFull.length,
            extractedTextFull,
          },
        }
      },
    })
  }

  private async extractText(contentBase64: string, mimeType: string) {
    const response = await this.imageAnalyzerAgent.generate(
      [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Transcribe only the readable text from this image. Return plain text only.',
            },
            {
              type: 'image',
              image: contentBase64,
              mimeType,
            },
          ],
        },
      ],
    )

    const extractedTextFull = response.text

    if (typeof extractedTextFull !== 'string') {
      throw new AppError(
        'O agente de análise de imagem não retornou uma extração válida.',
        'Erro de Extração de Imagem',
      )
    }

    return this.normalizeText(extractedTextFull)
  }

  private normalizeText(text: string) {
    const normalized = text
      .replace(/[^\S\r\n]+/g, ' ')
      .replace(/\s*\n\s*/g, '\n')
      .replace(/\s+/g, ' ')
      .trim()

    if (this.isEmptyTextResponse(normalized)) {
      return ''
    }

    return normalized
  }

  private isEmptyTextResponse(text: string) {
    return [
      '',
      '""',
      "''",
      'não há texto legível',
      'nao ha texto legivel',
      'sem texto legível',
      'sem texto legivel',
      'no readable text',
      'no text detected',
    ].includes(text.toLowerCase())
  }
}
