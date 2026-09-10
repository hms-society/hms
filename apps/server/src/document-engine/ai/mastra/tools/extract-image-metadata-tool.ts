import { createTool } from '@mastra/core/tools'
import { Injectable } from '@nestjs/common'
import { AppError } from '@hms/core/shared/domain/errors'
import { DocumentValidationStatus } from '@hms/core/document-engine/domain/structures'
import { z } from 'zod'

import { DocumentImageAnalyzerAgent } from '@/document-engine/ai/mastra/agents'
import { suggestionSchema } from '@/document-engine/ai/mastra/schemas'
import { EnvProvider } from '@/shared/provision/env/env-provider'

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
    textLength: z.number().int().min(0),
    extractedTextFull: z.string(),
  }),
  suggestion: suggestionSchema.optional(),
})

@Injectable()
export class ExtractImageTool {
  readonly function: ReturnType<
    typeof createTool<'extract-image-metadata', typeof inputSchema, typeof outputSchema>
  >

  constructor(
    private readonly imageAnalyzerAgent: DocumentImageAnalyzerAgent,
    private readonly envProvider: EnvProvider,
  ) {
    this.function = createTool({
      id: 'extract-image-metadata',
      description: 'Extract text from an image document with a local vision model.',
      inputSchema,
      outputSchema,
      strict: true,
      execute: async (input) => {
        if (input.suggestion?.suggestedStatus === DocumentValidationStatus.Duplicate) {
          return {
            batchId: input.batchId,
            documentFileId: input.documentFileId,
            metadata: {
              mimeType: input.mimeType,
              sizeBytes: input.sizeBytes,
              hashSha256: input.hashSha256,
              textLength: 0,
              extractedTextFull: '',
            },
            suggestion: input.suggestion,
          }
        }

        const extraction = await this.extractText(input.contentBase64, input.mimeType)

        if (!extraction.success) {
          return {
            batchId: input.batchId,
            documentFileId: input.documentFileId,
            metadata: {
              mimeType: input.mimeType,
              sizeBytes: input.sizeBytes,
              hashSha256: input.hashSha256,
              textLength: 0,
              extractedTextFull: '',
            },
            suggestion: this.buildProcessingFailureSuggestion(extraction.reason),
          }
        }

        const extractedTextFull = extraction.text

        return {
          batchId: input.batchId,
          documentFileId: input.documentFileId,
          metadata: {
            mimeType: input.mimeType,
            sizeBytes: input.sizeBytes,
            hashSha256: input.hashSha256,
            textLength: extractedTextFull.length,
            extractedTextFull,
          },
          suggestion: input.suggestion,
        }
      },
    })
  }

  private async extractText(contentBase64: string, mimeType: string) {
    try {
      const response = await this.withTemporaryAiTimeout(
        this.imageAnalyzerAgent.generate([
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
        ]),
      )

      const extractedTextFull = response.text

      if (typeof extractedTextFull !== 'string') {
        throw new AppError(
          'O agente de análise de imagem não retornou uma extração válida.',
          'Erro de Extração de Imagem',
        )
      }

      return {
        success: true as const,
        text: this.normalizeText(extractedTextFull),
      }
    } catch (error) {
      return {
        success: false as const,
        reason: this.normalizeErrorReason(error),
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
        'Verifique se o modelo local de visão está disponível e tente processar o documento novamente.',
    }
  }

  private async withTemporaryAiTimeout<Result>(operation: Promise<Result>) {
    const timeoutMs = this.envProvider.get('OLLAMA_REQUEST_TIMEOUT_MS')
    let timeout: ReturnType<typeof setTimeout>

    try {
      return await Promise.race([
        operation,
        new Promise<Result>((_, reject) => {
          timeout = setTimeout(
            () =>
              reject(
                new AppError(
                  `Tempo limite de ${timeoutMs}ms excedido na chamada de IA local.`,
                  'Timeout de IA Local',
                ),
              ),
            timeoutMs,
          )
        }),
      ])
    } finally {
      clearTimeout(timeout!)
    }
  }

  private normalizeErrorReason(error: unknown) {
    if (error instanceof Error && error.message.trim().length > 0) {
      return `A IA retornou erro durante a extração da imagem: ${error.message
        .trim()
        .slice(0, 160)}`
    }

    return 'A IA retornou erro durante a extração da imagem.'
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
