import { createStep, createWorkflow } from '@mastra/core/workflows'
import { Mastra } from '@mastra/core/mastra'
import { Observability } from '@mastra/observability'
import { SamplingStrategyType, SpanType } from '@mastra/core/observability'
import { Injectable } from '@nestjs/common'
import { DocumentReviewDecision } from '@hms/core/document-production/domain/structures'
import type { DocumentGenerationWorkflowInput } from '@hms/core/document-production/domain/structures'
import type {
  DocumentGenerationWorkflowResult,
  GenerateDocumentWorkflow as IGenerateDocumentWorkflow,
} from '@hms/core/document-production/interfaces'
import { AppError } from '@hms/core/shared/domain/errors'
import { GrafanaOtelBridge } from '@/shared/ai/mastra/grafana-otel-bridge'
import { EnvProvider } from '@/shared/provision/env/env-provider'
import {
  DocumentWriterAgent,
  DocumentReviewerAgent,
} from '@/document-production/ai/mastra/agents'

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

@Injectable()
export class GenerateDocumentWorkflow implements IGenerateDocumentWorkflow {
  private readonly mastra: Mastra

  constructor(
    private readonly loadDocumentGenerationTool: LoadDocumentGenerationTool,
    private readonly prepareDocumentGenerationTool: PrepareDocumentGenerationTool,
    private readonly startDocumentGenerationTool: StartDocumentGenerationTool,
    private readonly saveGeneratedDocumentVersionTool: SaveGeneratedDocumentVersionTool,
    private readonly failDocumentGenerationTool: FailDocumentGenerationTool,
    private readonly reviewDocumentCycleTool: ReviewDocumentCycleTool,
    private readonly resolveDocumentGenerationOutcomeTool: ResolveDocumentGenerationOutcomeTool,
    writerAgent: DocumentWriterAgent,
    reviewerAgent: DocumentReviewerAgent,
    envProvider: EnvProvider,
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

    const workflow = createWorkflow({
      id: 'generate-document-workflow',
      inputSchema: documentGenerationWorkflowInputSchema,
      outputSchema: documentGenerationWorkflowOutputSchema,
      // Inngest owns durable retries; observability must not add snapshot storage.
      options: { shouldPersistSnapshot: () => false },
    })
      .then(prepareGenerationStep)
      .then(startGenerationStep)
      .then(loadGenerationStep)
      .map(async ({ inputData }) => ({
        documentGenerationId: inputData.id,
        instructions: inputData.instructions,
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

    this.mastra = new Mastra({
      logger: false,
      agents: { writerAgent, reviewerAgent },
      workflows: { 'generate-document-workflow': workflow },
      observability: new Observability({
        configs: {
          grafana: {
            serviceName: 'hms-server',
            sampling: {
              type: envProvider.get('OTEL_EXPORTER_OTLP_ENDPOINT')
                ? SamplingStrategyType.ALWAYS
                : SamplingStrategyType.NEVER,
            },
            bridge: new GrafanaOtelBridge(),
            excludeSpanTypes: [SpanType.MODEL_CHUNK],
          },
        },
      }),
    })
  }

  async run(
    input: DocumentGenerationWorkflowInput,
  ): Promise<DocumentGenerationWorkflowResult> {
    const run = await this.mastra.getWorkflow('generate-document-workflow').createRun()
    const result = await run.start({
      inputData: input,
      tracingOptions: {
        hideInput: true,
        hideOutput: true,
        metadata: {
          documentGenerationId: input.documentGenerationId,
          documentId: input.documentId,
          documentSpecificationVersionId: input.documentSpecificationVersionId,
        },
      },
    })

    if (result.status === 'failed') throw result.error

    if (result.status !== 'success') {
      throw new AppError(
        `O fluxo de geração documental terminou com o estado ${result.status}.`,
        'Erro de Geração Documental',
      )
    }

    const output = documentGenerationWorkflowOutputSchema.parse(result.result)
    if (output.status === 'approved') {
      return {
        status: output.status,
        documentGenerationId: output.documentGenerationId,
        documentVersionId: output.documentVersionId,
        attemptsCount: output.attemptsCount,
        pendingMarkersCount: output.pendingMarkers.length,
      }
    }

    return {
      status: output.status,
      documentGenerationId: output.documentGenerationId,
      attemptsCount: output.attemptsCount,
      findingsCount: output.findings.length,
    }
  }
}
