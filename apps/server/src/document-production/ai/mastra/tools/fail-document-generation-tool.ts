import { createTool } from '@mastra/core/tools'
import { Inject, Injectable } from '@nestjs/common'
import { DocumentReviewFindingCategory } from '@hms/core/document-production/domain/structures'
import type { DocumentGenerationsRepository } from '@hms/core/document-production/interfaces'
import { FailDocumentGenerationUseCase } from '@hms/core/document-production/use-cases'
import { z } from 'zod'

import { documentReviewCycleOutputSchema } from '@/document-production/ai/mastra/schemas'
import { DOCUMENT_PRODUCTION_REPOSITORIES } from '@/document-production/constants/document-production-repositories'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'

@Injectable()
export class FailDocumentGenerationTool {
  static readonly FINDING_SCHEMA = z.object({
    category: z.enum(DocumentReviewFindingCategory),
    message: z.string().trim().min(1),
  })
  static readonly INPUT_SCHEMA = documentReviewCycleOutputSchema
  static readonly OUTPUT_SCHEMA = z.object({
    status: z.literal('failed'),
    documentGenerationId: z.string().uuid(),
    attemptsCount: z.number().int().min(0).max(3),
    findings: z.array(FailDocumentGenerationTool.FINDING_SCHEMA),
  })

  readonly function: ReturnType<
    typeof createTool<
      'fail-document-generation',
      typeof FailDocumentGenerationTool.INPUT_SCHEMA,
      typeof FailDocumentGenerationTool.OUTPUT_SCHEMA
    >
  >

  constructor(
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.generations)
    generationsRepository: DocumentGenerationsRepository,
    datetimeProvider: DatetimeProvider,
  ) {
    const useCase = new FailDocumentGenerationUseCase(
      generationsRepository,
      datetimeProvider,
    )

    this.function = createTool({
      id: 'fail-document-generation',
      description: 'Persist the understandable final failure of a document generation.',
      inputSchema: FailDocumentGenerationTool.INPUT_SCHEMA,
      outputSchema: FailDocumentGenerationTool.OUTPUT_SCHEMA,
      strict: true,
      execute: async (input) => {
        const findings = input.review.findings.map((finding) => ({
          category: finding.category,
          message: finding.description,
        }))
        const generation = await useCase.execute({
          documentGenerationId: input.documentGenerationId,
          attemptsCount: input.attemptsCount,
          failureMessage:
            'A revisão automática não aprovou o documento após três tentativas.',
          findings,
        })

        return {
          documentGenerationId: generation.id,
          status: 'failed' as const,
          attemptsCount: generation.attemptsCount,
          findings: [...generation.findings],
        }
      },
    })
  }
}
