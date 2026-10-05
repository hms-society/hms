import { createTool } from '@mastra/core/tools'
import { Inject, Injectable } from '@nestjs/common'
import {
  DocumentReviewDecision,
  DocumentReviewFindingCategory,
} from '@hms/core/document-production/domain/structures'
import { AppError } from '@hms/core/shared/domain/errors'
import { FindDocumentPendingMarkersUseCase } from '@hms/core/document-production/use-cases'
import { z } from 'zod'

import {
  DocumentReviewerAgent,
  DocumentWriterAgent,
} from '@/document-production/ai/mastra/agents'
import {
  documentDraftAiOutputSchema,
  documentDraftSchema,
  documentReviewCycleInputSchema,
  documentReviewCycleOutputSchema,
  documentReviewSchema,
} from '@/document-production/ai/mastra/schemas'
import { EnvProvider } from '@/shared/provision/env/env-provider'

type ReviewCycleInput = z.infer<typeof documentReviewCycleInputSchema>
type Draft = z.infer<typeof documentDraftSchema>
type DraftAiOutput = z.infer<typeof documentDraftAiOutputSchema>

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
    @Inject(EnvProvider) private readonly envProvider: EnvProvider,
  ) {
    this.function = createTool({
      id: 'review-document-cycle',
      description: 'Write and review one document draft iteration.',
      inputSchema: documentReviewCycleInputSchema,
      outputSchema: documentReviewCycleOutputSchema,
      strict: true,
      execute: async (input) => {
        const writerResponse = await this.writerAgent.generate(
          this.createWriterPrompt(input),
          {
            structuredOutput: { schema: documentDraftAiOutputSchema },
          },
        )
        const draftOutput = writerResponse.object

        if (this.envProvider.get('HMS_SERVER_APP_MODE') === 'dev') {
          console.log(
            '[document-generation] writer AI response',
            JSON.stringify(
              {
                documentGenerationId: input.documentGenerationId,
                attempt: input.attemptsCount + 1,
                output: draftOutput ?? null,
              },
              null,
              2,
            ),
          )
        }

        if (!draftOutput) {
          throw new AppError(
            'O agente redator não retornou um documento válido.',
            'Erro de Geração Documental',
          )
        }

        const draft = this.convertDraftOutputToTiptap(draftOutput)
        const pendingMarkers = await this.findDocumentPendingMarkersUseCase.execute({
          content: draft.content,
        })
        const reviewerResponse = await this.generateReviewWithSchemaRecovery(
          input,
          draft,
          pendingMarkers,
        )
        const review = reviewerResponse.object

        if (!review) {
          throw new AppError(
            'O agente revisor não retornou uma revisão válida.',
            'Erro de Geração Documental',
          )
        }

        const normalizedReview = this.normalizeReviewForHumanCompletion(
          input,
          pendingMarkers,
          review,
        )

        return {
          ...input,
          attemptsCount: input.attemptsCount + 1,
          draft,
          review: normalizedReview,
          pendingMarkers,
        }
      },
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

  private convertDraftOutputToTiptap(output: DraftAiOutput): Draft {
    const content: Record<string, unknown>[] = []

    for (const block of output.blocks) {
      const textContent = block.runs.map((run) => ({
        type: 'text',
        text: run.text,
        ...(run.marks.length > 0 ? { marks: run.marks.map((type) => ({ type })) } : {}),
      }))

      if (block.kind === 'heading1' || block.kind === 'heading2') {
        content.push({
          type: 'heading',
          attrs: { level: block.kind === 'heading1' ? 1 : 2, textAlign: null },
          content: textContent,
        })
        continue
      }

      if (block.kind === 'bullet' || block.kind === 'ordered') {
        const listType = block.kind === 'bullet' ? 'bulletList' : 'orderedList'
        const listItem = {
          type: 'listItem',
          content: [{ type: 'paragraph', content: textContent }],
        }
        const previousBlock = content.at(-1)

        if (previousBlock?.type === listType && Array.isArray(previousBlock.content)) {
          previousBlock.content.push(listItem)
        } else {
          content.push({ type: listType, content: [listItem] })
        }

        continue
      }

      const paragraph = { type: 'paragraph', content: textContent }

      if (block.kind === 'quote') {
        const previousBlock = content.at(-1)

        if (
          previousBlock?.type === 'blockquote' &&
          Array.isArray(previousBlock.content)
        ) {
          previousBlock.content.push(paragraph)
        } else {
          content.push({ type: 'blockquote', content: [paragraph] })
        }

        continue
      }

      content.push(paragraph)
    }

    return documentDraftSchema.parse({ content: { type: 'doc', content } })
  }

  private createReviewerPrompt(
    input: ReviewCycleInput,
    draft: Draft,
    pendingMarkers: readonly { marker: string }[],
    validationError?: string,
  ): string {
    return JSON.stringify({
      task: 'review_document_draft',
      template: input.template,
      source: input.source,
      ...(input.instructions ? { instructions: input.instructions } : {}),
      draft,
      pendingMarkers,
      outputContract: {
        decision: {
          allowedValues: Object.values(DocumentReviewDecision),
          rule: 'Use approved only with zero findings; use changes_required with one or more findings.',
        },
        findingCategories: Object.values(DocumentReviewFindingCategory),
        fields: ['decision', 'findings'],
      },
      ...(validationError
        ? {
            retryInstructions: {
              validationError,
              instruction:
                'Return decision as exactly "approved" or "changes_required". Do not use synonyms. Return only the corrected JSON object matching outputContract.',
            },
          }
        : {}),
    })
  }

  private async generateReviewWithSchemaRecovery(
    input: ReviewCycleInput,
    draft: Draft,
    pendingMarkers: readonly { marker: string }[],
  ) {
    try {
      return await this.reviewerAgent.generate(
        this.createReviewerPrompt(input, draft, pendingMarkers),
        { structuredOutput: { schema: documentReviewSchema } },
      )
    } catch (error) {
      if (
        !(error instanceof Error) ||
        !error.message.includes('Structured output validation failed')
      ) {
        throw error
      }

      return this.reviewerAgent.generate(
        this.createReviewerPrompt(input, draft, pendingMarkers, error.message),
        { structuredOutput: { schema: documentReviewSchema } },
      )
    }
  }

  private normalizeReviewForHumanCompletion(
    input: ReviewCycleInput,
    pendingMarkers: readonly { marker: string }[],
    review: z.infer<typeof documentReviewSchema>,
  ): z.infer<typeof documentReviewSchema> {
    if (review.decision !== DocumentReviewDecision.ChangesRequired) return review

    const sourceVariableValues = input.source.data.templateVariableValues
    const resolvedValues =
      typeof sourceVariableValues === 'object' &&
      sourceVariableValues !== null &&
      !Array.isArray(sourceVariableValues)
        ? (sourceVariableValues as Record<string, unknown>)
        : {}

    const expectedMissingMarkers = input.template.variables
      .filter((variable) => !variable.isRemoved)
      .filter((variable) => {
        const value = resolvedValues[variable.technicalName]
        return typeof value !== 'string' || !value.trim()
      })
      .map((variable) => ({
        marker: `{${variable.technicalName}}`,
        technicalName: variable.technicalName,
        label: variable.label,
      }))
      .filter(({ marker }) => pendingMarkers.some((pending) => pending.marker === marker))

    if (expectedMissingMarkers.length === 0) return review

    const findings = review.findings.filter((finding) => {
      if (finding.category !== DocumentReviewFindingCategory.PendingCorrespondence) {
        return true
      }

      const findingText = this.normalizeText(
        `${finding.description} ${finding.correction}`,
      )

      return !expectedMissingMarkers.some(({ marker, technicalName, label }) =>
        [marker, technicalName, label].some((value) =>
          findingText.includes(this.normalizeText(value)),
        ),
      )
    })

    if (findings.length === review.findings.length) return review
    if (findings.length > 0) {
      return { decision: DocumentReviewDecision.ChangesRequired, findings }
    }

    return { decision: DocumentReviewDecision.Approved, findings: [] }
  }

  private normalizeText(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
  }
}
