import { createTool } from '@mastra/core/tools'
import { Inject, Injectable } from '@nestjs/common'
import type {
  DocumentGenerationsRepository,
  DocumentSpecificationsRepository,
} from '@hms/core/document-production/interfaces'
import { PrepareDocumentGenerationUseCase } from '@hms/core/document-production/use-cases'
import { z } from 'zod'

import {
  documentGenerationSourceSchema,
  documentGenerationWorkflowInputSchema,
} from '@/document-production/ai/mastra/schemas'
import { DOCUMENT_PRODUCTION_REPOSITORIES } from '@/document-production/constants/document-production-repositories'

const outputSchema = z.object({
  documentGenerationId: z.string().uuid(),
  instructions: z.string().trim().min(1).max(4000).optional(),
  source: documentGenerationSourceSchema,
})

@Injectable()
export class PrepareDocumentGenerationTool {
  readonly function: ReturnType<
    typeof createTool<
      'prepare-document-generation',
      typeof documentGenerationWorkflowInputSchema,
      typeof outputSchema
    >
  >

  constructor(
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.generations)
    generationsRepository: DocumentGenerationsRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.specifications)
    specificationsRepository: DocumentSpecificationsRepository,
  ) {
    const useCase = new PrepareDocumentGenerationUseCase(
      generationsRepository,
      specificationsRepository,
    )

    this.function = createTool({
      id: 'prepare-document-generation',
      description:
        'Create a pending document generation with immutable source and template snapshots.',
      inputSchema: documentGenerationWorkflowInputSchema,
      outputSchema,
      strict: true,
      execute: async (input) => {
        const generation = await useCase.execute(input)

        return {
          documentGenerationId: generation.id,
          instructions: input.instructions,
          source: input.source,
        }
      },
    })
  }
}
