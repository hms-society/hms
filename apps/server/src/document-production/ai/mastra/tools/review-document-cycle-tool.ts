import { createTool } from '@mastra/core/tools'
import { Injectable } from '@nestjs/common'
import { AppError } from '@hms/core/shared/domain/errors'
import { FindDocumentPendingMarkersUseCase } from '@hms/core/document-production/use-cases'
import { z } from 'zod'
import { documentTemplateContentSchema } from '@hms/validation/document-production'

import {
  DocumentReviewerAgent,
  DocumentWriterAgent,
} from '@/document-production/ai/mastra/agents'
import {
  documentDraftSchema,
  documentReviewCycleInputSchema,
  documentReviewCycleOutputSchema,
  documentReviewSchema,
} from '@/document-production/ai/mastra/schemas'

type ReviewCycleInput = z.infer<typeof documentReviewCycleInputSchema>
type Draft = z.infer<typeof documentDraftSchema>

const writerResponseSchema = z.union([
  documentTemplateContentSchema,
  z
    .object({
      content: z.union([
        documentTemplateContentSchema,
        documentTemplateContentSchema.shape.content.unwrap(),
      ]),
    })
    .strict(),
])

@Injectable()
export class ReviewDocumentCycleTool {
  readonly function: ReturnType<
    typeof createTool<
      'review-document-cycle',
      typeof documentReviewCycleInputSchema,
      typeof documentReviewCycleOutputSchema
    >
  >

  constructor(
    private readonly writerAgent: DocumentWriterAgent,
    private readonly reviewerAgent: DocumentReviewerAgent,
    private readonly findDocumentPendingMarkersUseCase: FindDocumentPendingMarkersUseCase,
  ) {
    this.function = createTool({
      id: 'review-document-cycle',
      description: 'Write and review one document draft iteration.',
      inputSchema: documentReviewCycleInputSchema,
      outputSchema: documentReviewCycleOutputSchema,
      strict: true,
      execute: async (input, context) => {
        const tracingContext = context?.tracingContext
        const metadata = {
          documentGenerationId: input.documentGenerationId,
          reviewAttempt: input.attemptsCount + 1,
        }
        tracingContext?.currentSpan?.update({ metadata })
        const writerResponse = await this.writerAgent.generate(
          this.createWriterPrompt(input),
          {
            tracingContext,
            tracingOptions: { hideInput: true, hideOutput: true, metadata },
            structuredOutput: {
              schema: writerResponseSchema,
              jsonPromptInjection: true,
              errorStrategy: 'strict',
            },
          },
        )
        const writerOutput = writerResponse.object

        if (!writerOutput) {
          throw new AppError(
            'O agente redator não retornou um documento válido.',
            'Erro de Geração Documental',
          )
        }

        const draft = this.normalizeWriterOutput(writerOutput)

        const pendingMarkers = await this.findDocumentPendingMarkersUseCase.execute({
          content: draft.content,
        })
        const reviewerResponse = await this.reviewerAgent.generate(
          this.createReviewerPrompt(input, draft, pendingMarkers),
          {
            tracingContext,
            tracingOptions: { hideInput: true, hideOutput: true, metadata },
            structuredOutput: { schema: documentReviewSchema },
          },
        )
        const review = reviewerResponse.object

        if (!review) {
          throw new AppError(
            'O agente revisor não retornou uma revisão válida.',
            'Erro de Geração Documental',
          )
        }

        tracingContext?.currentSpan?.update({
          metadata: {
            reviewDecision: review.decision,
            pendingMarkersCount: pendingMarkers.length,
          },
        })

        return {
          ...input,
          attemptsCount: input.attemptsCount + 1,
          draft,
          review,
          pendingMarkers,
        }
      },
    })
  }

  private normalizeWriterOutput(output: z.infer<typeof writerResponseSchema>): Draft {
    if ('type' in output) return documentDraftSchema.parse({ content: output })
    return documentDraftSchema.parse({
      content: Array.isArray(output.content)
        ? { type: 'doc', content: output.content }
        : output.content,
    })
  }

  private createWriterPrompt(input: ReviewCycleInput): string {
    return JSON.stringify({
      task: input.draft ? 'correct_document_draft' : 'write_document_draft',
      template: input.template,
      source: input.source,
      ...(input.instructions ? { instructions: input.instructions } : {}),
      ...(input.draft ? { currentDraft: input.draft } : {}),
      ...(input.review ? { reviewFindings: input.review.findings } : {}),
    })
  }

  private createReviewerPrompt(
    input: ReviewCycleInput,
    draft: Draft,
    pendingMarkers: readonly { marker: string }[],
  ): string {
    return JSON.stringify({
      task: 'review_document_draft',
      template: input.template,
      source: input.source,
      ...(input.instructions ? { instructions: input.instructions } : {}),
      draft,
      pendingMarkers,
    })
  }
}
