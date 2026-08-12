import { createStep, createWorkflow } from '@mastra/core/workflows'
import { Injectable } from '@nestjs/common'
import { DocumentReviewDecision } from '@hms/core/document-production/domain/structures'
import type { DocumentGenerationWorkflowInput } from '@hms/core/document-production/domain/structures'
import type { GenerateDocumentWorkflow as IGenerateDocumentWorkflow } from '@hms/core/document-production/interfaces'
import { AppError } from '@hms/core/shared/domain/errors'

import {
  documentGenerationWorkflowInputSchema,
  documentGenerationWorkflowOutputSchema,
} from '@/document-production/ai/mastra/schemas'
import {
  FailDocumentGenerationTool,
  LoadDocumentGenerationTool,
  PrepareDocumentGenerationTool,
  ResolveDocumentGenerationOutcomeTool,
  ReviewDocumentCycleTool,
  SaveGeneratedDocumentVersionTool,
  StartDocumentGenerationTool,
} from '@/document-production/ai/mastra/tools'

type DocumentWorkflow = ReturnType<typeof createWorkflow>

@Injectable()
export class GenerateDocumentWorkflow implements IGenerateDocumentWorkflow {
  private readonly workflow: DocumentWorkflow

  constructor(
    private readonly loadDocumentGenerationTool: LoadDocumentGenerationTool,
    private readonly prepareDocumentGenerationTool: PrepareDocumentGenerationTool,
    private readonly startDocumentGenerationTool: StartDocumentGenerationTool,
    private readonly saveGeneratedDocumentVersionTool: SaveGeneratedDocumentVersionTool,
    private readonly failDocumentGenerationTool: FailDocumentGenerationTool,
    private readonly reviewDocumentCycleTool: ReviewDocumentCycleTool,
    private readonly resolveDocumentGenerationOutcomeTool: ResolveDocumentGenerationOutcomeTool,
  ) {
    const prepareGenerationStep = createStep(this.prepareDocumentGenerationTool.function)
    const startGenerationStep = createStep(this.startDocumentGenerationTool.function)
    const loadGenerationStep = createStep(this.loadDocumentGenerationTool.function)
    const reviewCycleStep = createStep(this.reviewDocumentCycleTool.function)
    const resolveOutcomeStep = createStep(
      this.resolveDocumentGenerationOutcomeTool.function,
    )
    const saveGeneratedVersionStep = createStep(
      this.saveGeneratedDocumentVersionTool.function,
    )
    const failGenerationStep = createStep(this.failDocumentGenerationTool.function)

    this.workflow = createWorkflow({
      id: 'generate-document-workflow',
      inputSchema: documentGenerationWorkflowInputSchema,
      outputSchema: documentGenerationWorkflowOutputSchema,
    })
      .then(prepareGenerationStep)
      .then(startGenerationStep)
      .then(loadGenerationStep)
      .map(async ({ inputData }) => ({
        documentGenerationId: inputData.id,
        source: inputData.source,
        template: inputData.template,
        attemptsCount: 0,
      }))
      .dowhile(
        reviewCycleStep,
        async ({ inputData }) =>
          inputData.review.decision === DocumentReviewDecision.ChangesRequired &&
          inputData.attemptsCount < 3,
      )
      .branch([
        [
          async ({ inputData }) =>
            inputData.review.decision === DocumentReviewDecision.Approved,
          saveGeneratedVersionStep,
        ],
        [
          async ({ inputData }) =>
            inputData.review.decision !== DocumentReviewDecision.Approved,
          failGenerationStep,
        ],
      ])
      .then(resolveOutcomeStep)
      .commit()
  }

  async run(input: DocumentGenerationWorkflowInput): Promise<void> {
    const run = await this.workflow.createRun()
    const result = await run.start({ inputData: input })

    if (result.status !== 'success') {
      throw new AppError(
        'O fluxo de geração documental não foi concluído.',
        'Erro de Geração Documental',
      )
    }

    documentGenerationWorkflowOutputSchema.parse(result.result)
  }
}
