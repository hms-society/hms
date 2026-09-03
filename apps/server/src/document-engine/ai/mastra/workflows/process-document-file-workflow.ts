import { createStep, createWorkflow } from '@mastra/core/workflows'
import { Injectable } from '@nestjs/common'
import type {
  ProcessDocumentFileWorkflow as IProcessDocumentFileWorkflow,
} from '@hms/core/document-engine/interfaces'
import type {
  ProcessDocumentFileWorkflowInput,
  ProcessDocumentFileWorkflowResult,
} from '@hms/core/document-engine/domain/structures'
import { AppError } from '@hms/core/shared/domain/errors'

import {
  inputSchema,
  outputSchema,
} from '@/document-engine/ai/mastra/schemas'
import {
  ExtractImageTool,
  ExtractPdfTool,
  ExtractUnsupportedFileTool,
  LoadFileTool,
  RecordMetadataTool,
} from '@/document-engine/ai/mastra/tools'

type DocumentFileWorkflow = ReturnType<typeof createWorkflow>

@Injectable()
export class ProcessDocumentFileWorkflow implements IProcessDocumentFileWorkflow {
  private readonly workflow: DocumentFileWorkflow

  constructor(
    private readonly loadFileTool: LoadFileTool,
    private readonly extractPdfTool: ExtractPdfTool,
    private readonly extractImageTool: ExtractImageTool,
    private readonly extractUnsupportedFileTool: ExtractUnsupportedFileTool,
    private readonly recordMetadataTool: RecordMetadataTool,
  ) {
    const loadFileStep = createStep(this.loadFileTool.function)
    const extractPdfStep = createStep(this.extractPdfTool.function)
    const extractImageStep = createStep(this.extractImageTool.function)
    const extractUnsupportedFileStep = createStep(this.extractUnsupportedFileTool.function)
    const recordMetadataStep = createStep(this.recordMetadataTool.function)

    this.workflow = createWorkflow({
      id: 'process-document-file-workflow',
      inputSchema,
      outputSchema,
    })
      .then(loadFileStep)
      .branch([
        [
          async ({ inputData }) => inputData.mimeType === 'application/pdf',
          extractPdfStep,
        ],
        [
          async ({ inputData }) => inputData.mimeType.startsWith('image/'),
          extractImageStep,
        ],
        [
          async ({ inputData }) =>
            inputData.mimeType !== 'application/pdf' &&
            !inputData.mimeType.startsWith('image/'),
          extractUnsupportedFileStep,
        ],
      ])
      .map(async ({ inputData }) => {
        const result = Object.values(inputData)[0]

        return outputSchema.parse(result)
      })
      .then(recordMetadataStep)
      .commit()
  }

  async run(
    input: ProcessDocumentFileWorkflowInput,
  ): Promise<ProcessDocumentFileWorkflowResult> {
    const run = await this.workflow.createRun()
    const result = await run.start({ inputData: input })

    if (result.status === 'failed') throw result.error

    if (result.status !== 'success') {
      throw new AppError(
        `O fluxo de processamento documental terminou com o estado ${result.status}.`,
        'Erro de Processamento Documental',
      )
    }

    return outputSchema.parse(result.result)
  }
}
