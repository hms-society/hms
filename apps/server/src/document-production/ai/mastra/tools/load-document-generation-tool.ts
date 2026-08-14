import { createTool } from '@mastra/core/tools'
import { Inject, Injectable } from '@nestjs/common'
import type { DocumentGeneration } from '@hms/core/document-production/domain/entities'
import {
  DocumentGenerationStatus,
  DocumentReviewFindingCategory,
} from '@hms/core/document-production/domain/structures'
import type { DocumentGenerationsRepository } from '@hms/core/document-production/interfaces'
import { LoadDocumentGenerationUseCase } from '@hms/core/document-production/use-cases'
import {
  documentTemplateContentSchema,
  documentTemplateVariableSchema,
} from '@hms/validation/document-production'
import { z } from 'zod'

import { documentGenerationSourceSchema } from '@/document-production/ai/mastra/schemas'
import { DOCUMENT_PRODUCTION_REPOSITORIES } from '@/document-production/constants/document-production-repositories'

const inputSchema = z.object({
  documentGenerationId: z.string().uuid(),
  instructions: z.string().trim().min(1).max(4000).optional(),
  source: documentGenerationSourceSchema,
})

const outputSchema = z.object({
  id: z.string().uuid(),
  documentId: z.string().uuid(),
  documentSpecificationVersionId: z.string().uuid(),
  requestedByCollaboratorId: z.string().uuid(),
  instructions: z.string().trim().min(1).max(4000).optional(),
  source: documentGenerationSourceSchema,
  template: z.object({
    name: z.string(),
    content: documentTemplateContentSchema,
    variables: z.array(documentTemplateVariableSchema),
  }),
  status: z.enum(DocumentGenerationStatus),
  attemptsCount: z.number().int().min(0).max(3),
  findings: z.array(
    z.object({
      category: z.enum(DocumentReviewFindingCategory),
      message: z.string(),
    }),
  ),
  documentVersionId: z.string().uuid().optional(),
  failureMessage: z.string().optional(),
  startedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
  failedAt: z.string().datetime().optional(),
  cancelledAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

type Output = z.infer<typeof outputSchema>

@Injectable()
export class LoadDocumentGenerationTool {
  readonly function: ReturnType<
    typeof createTool<'load-document-generation', typeof inputSchema, typeof outputSchema>
  >

  constructor(
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.generations)
    generationsRepository: DocumentGenerationsRepository,
  ) {
    const useCase = new LoadDocumentGenerationUseCase(generationsRepository)

    this.function = createTool({
      id: 'load-document-generation',
      description:
        'Load the immutable context and current state of a document generation.',
      inputSchema,
      outputSchema,
      strict: true,
      execute: async (input) => {
        const generation = await useCase.execute({
          documentGenerationId: input.documentGenerationId,
        })

        return this.serializeDocumentGeneration(
          generation,
          input.source,
          input.instructions,
        )
      },
    })
  }

  private serializeDocumentGeneration(
    generation: DocumentGeneration,
    source: Output['source'],
    instructions: Output['instructions'],
  ): Output {
    return {
      id: generation.id,
      documentId: generation.documentId,
      documentSpecificationVersionId: generation.documentSpecificationVersionId,
      requestedByCollaboratorId: generation.requestedByCollaboratorId,
      instructions,
      source,
      template: {
        name: generation.template.name,
        content: documentTemplateContentSchema.parse(generation.template.content),
        variables: generation.template.variables.map((variable) =>
          documentTemplateVariableSchema.parse(variable),
        ),
      },
      status: generation.status,
      attemptsCount: generation.attemptsCount,
      findings: [...generation.findings],
      ...(generation.documentVersionId
        ? { documentVersionId: generation.documentVersionId }
        : {}),
      ...(generation.failureMessage ? { failureMessage: generation.failureMessage } : {}),
      ...(generation.startedAt ? { startedAt: generation.startedAt.toISOString() } : {}),
      ...(generation.completedAt
        ? { completedAt: generation.completedAt.toISOString() }
        : {}),
      ...(generation.failedAt ? { failedAt: generation.failedAt.toISOString() } : {}),
      ...(generation.cancelledAt
        ? { cancelledAt: generation.cancelledAt.toISOString() }
        : {}),
      createdAt: generation.createdAt.toISOString(),
      updatedAt: generation.updatedAt.toISOString(),
    }
  }
}
