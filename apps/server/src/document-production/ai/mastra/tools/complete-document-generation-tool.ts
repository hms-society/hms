import { createTool } from '@mastra/core/tools'
import { Inject, Injectable } from '@nestjs/common'
import type { DocumentGenerationsRepository } from '@hms/core/document-production/interfaces'
import { CompleteDocumentGenerationUseCase } from '@hms/core/document-production/use-cases'
import { z } from 'zod'

import { DOCUMENT_PRODUCTION_REPOSITORIES } from '@/document-production/constants/document-production-repositories'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'

@Injectable()
export class CompleteDocumentGenerationTool {
  static readonly INPUT_SCHEMA = z.object({
    documentGenerationId: z.string().uuid(),
    documentVersionId: z.string().uuid(),
    attemptsCount: z.number().int().min(1).max(3),
  })
  static readonly OUTPUT_SCHEMA = z.object({
    documentGenerationId: z.string().uuid(),
    documentVersionId: z.string().uuid(),
    status: z.literal('completed'),
  })

  readonly function: ReturnType<
    typeof createTool<
      'complete-document-generation',
      typeof CompleteDocumentGenerationTool.INPUT_SCHEMA,
      typeof CompleteDocumentGenerationTool.OUTPUT_SCHEMA
    >
  >

  constructor(
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.generations)
    generationsRepository: DocumentGenerationsRepository,
    datetimeProvider: DatetimeProvider,
  ) {
    const useCase = new CompleteDocumentGenerationUseCase(
      generationsRepository,
      datetimeProvider,
    )

    this.function = createTool({
      id: 'complete-document-generation',
      description:
        'Complete a running generation after its document version is persisted.',
      inputSchema: CompleteDocumentGenerationTool.INPUT_SCHEMA,
      outputSchema: CompleteDocumentGenerationTool.OUTPUT_SCHEMA,
      strict: true,
      execute: async (input) => {
        const generation = await useCase.execute(input)

        return {
          documentGenerationId: generation.id,
          documentVersionId: input.documentVersionId,
          status: 'completed' as const,
        }
      },
    })
  }
}
