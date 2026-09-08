import { createStep, createWorkflow } from '@mastra/core/workflows'
import { Injectable } from '@nestjs/common'
import type {
  ProcessDocumentFileWorkflowResult,
} from '@hms/core/document-engine/domain/structures'
import type {
  SuggestDocumentFileWorkflow as ISuggestDocumentFileWorkflow,
} from '@hms/core/document-engine/interfaces'
import { AppError } from '@hms/core/shared/domain/errors'

import { outputSchema } from '@/document-engine/ai/mastra/schemas'
import {
  CreateSuggestionTool,
  RecordMetadataTool,
} from '@/document-engine/ai/mastra/tools'

type DocumentSuggestionWorkflow = ReturnType<typeof createWorkflow>

@Injectable()
export class SuggestDocumentFileWorkflow implements ISuggestDocumentFileWorkflow {
  private readonly workflow: DocumentSuggestionWorkflow

  constructor(
    private readonly createSuggestionTool: CreateSuggestionTool,
    private readonly recordMetadataTool: RecordMetadataTool,
  ) {
    const createSuggestionStep = createStep(this.createSuggestionTool.function)
    const recordMetadataStep = createStep(this.recordMetadataTool.function)

    this.workflow = createWorkflow({
      id: 'suggest-document-file-workflow',
      inputSchema: outputSchema,
      outputSchema,
    })
      .then(createSuggestionStep)
      .then(recordMetadataStep)
      .commit()
  }

  async run(
    input: ProcessDocumentFileWorkflowResult,
  ): Promise<ProcessDocumentFileWorkflowResult> {
    const run = await this.workflow.createRun()
    const result = await run.start({ inputData: input })

    if (result.status === 'failed') throw result.error

    if (result.status !== 'success') {
      throw new AppError(
        `O fluxo de sugestão documental terminou com o estado ${result.status}.`,
        'Erro de Sugestão Documental',
      )
    }

    return outputSchema.parse(result.result)
  }
}
