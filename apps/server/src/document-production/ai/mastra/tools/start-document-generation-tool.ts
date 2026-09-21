import { createTool } from '@mastra/core/tools'
import { Inject, Injectable } from '@nestjs/common'
import type { DocumentGenerationsRepository } from '@hms/core/document-production/interfaces'
import { StartDocumentGenerationUseCase } from '@hms/core/document-production/use-cases'
import { z } from 'zod'

import { DOCUMENT_PRODUCTION_REPOSITORIES } from '@/document-production/constants/document-production-repositories'
import { documentGenerationSourceSchema } from '@/document-production/ai/mastra/schemas'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'

@Injectable()
export class StartDocumentGenerationTool {
  static readonly INPUT_SCHEMA = z.object({
    documentGenerationId: z.string().uuid(),
    source: documentGenerationSourceSchema,
  })
  static readonly OUTPUT_SCHEMA = z.object({
    documentGenerationId: z.string().uuid(),
    source: documentGenerationSourceSchema,
    status: z.literal('running'),
  })

  readonly function: ReturnType<
    typeof createTool<
      'start-document-generation',
      typeof StartDocumentGenerationTool.INPUT_SCHEMA,
      typeof StartDocumentGenerationTool.OUTPUT_SCHEMA
    >
  >

  constructor(
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.generations)
    generationsRepository: DocumentGenerationsRepository,
    datetimeProvider: DatetimeProvider,
  ) {
    const useCase = new StartDocumentGenerationUseCase(
      generationsRepository,
      datetimeProvider,
    )

    this.function = createTool({
      id: 'start-document-generation',
      description: 'Transition a pending document generation to running.',
      inputSchema: StartDocumentGenerationTool.INPUT_SCHEMA,
      outputSchema: StartDocumentGenerationTool.OUTPUT_SCHEMA,
      strict: true,
      execute: async (input) => {
        const generation = await useCase.execute({
          documentGenerationId: input.documentGenerationId,
        })

        return {
          documentGenerationId: generation.id,
          source: input.source,
          status: 'running' as const,
        }
      },
    })
  }
}
