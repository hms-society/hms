import { createTool } from '@mastra/core/tools'
import { Injectable } from '@nestjs/common'
import { AppError } from '@hms/core/shared/domain/errors'
import { z } from 'zod'

import { documentGenerationWorkflowOutputSchema } from '@/document-production/ai/mastra/schemas'

@Injectable()
export class ResolveDocumentGenerationOutcomeTool {
  static readonly INPUT_SCHEMA = z.object({
    'save-generated-document-version': documentGenerationWorkflowOutputSchema.optional(),
    'fail-document-generation': documentGenerationWorkflowOutputSchema.optional(),
  })
  static readonly OUTPUT_SCHEMA = documentGenerationWorkflowOutputSchema

  readonly function: ReturnType<
    typeof createTool<
      'resolve-document-generation-outcome',
      typeof ResolveDocumentGenerationOutcomeTool.INPUT_SCHEMA,
      typeof ResolveDocumentGenerationOutcomeTool.OUTPUT_SCHEMA
    >
  >

  constructor() {
    this.function = createTool({
      id: 'resolve-document-generation-outcome',
      description: 'Resolve the final approved draft or understandable findings.',
      inputSchema: ResolveDocumentGenerationOutcomeTool.INPUT_SCHEMA,
      outputSchema: ResolveDocumentGenerationOutcomeTool.OUTPUT_SCHEMA,
      strict: true,
      execute: async (input) => {
        const approved = input['save-generated-document-version']
        if (approved) return approved

        const failed = input['fail-document-generation']
        if (failed) return failed

        throw new AppError(
          'O fluxo não produziu um resultado final de geração.',
          'Erro de Geração Documental',
        )
      },
    })
  }
}
