import { createTool } from '@mastra/core/tools'
import { Inject, Injectable } from '@nestjs/common'
import type { DocumentGenerationsRepository } from '@hms/core/document-production/interfaces'
import { CompleteDocumentGenerationUseCase } from '@hms/core/document-production/use-cases'
import { z } from 'zod'

import { DOCUMENT_PRODUCTION_REPOSITORIES } from '@/document-production/constants/document-production-repositories'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'

const inputSchema = z.object({
  documentGenerationId: z.string().uuid(),
  documentVersionId: z.string().uuid(),
  attemptsCount: z.number().int().min(1).max(3),
})

const outputSchema = z.object({
  documentGenerationId: z.string().uuid(),
  documentVersionId: z.string().uuid(),
  status: z.literal('completed'),
})

@Injectable()
export class CompleteDocumentGenerationTool {
  readonly function: ReturnType<
    typeof createTool<
      'complete-document-generation',
      typeof inputSchema,
      typeof outputSchema
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
      inputSchema,
      outputSchema,
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
