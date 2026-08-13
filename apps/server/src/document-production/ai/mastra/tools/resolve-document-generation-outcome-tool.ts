import { createTool } from '@mastra/core/tools'
import { Injectable } from '@nestjs/common'
import { AppError } from '@hms/core/shared/domain/errors'
import { z } from 'zod'

import { documentGenerationWorkflowOutputSchema } from '@/document-production/ai/mastra/schemas'

const inputSchema = z.object({
  'save-generated-document-version': documentGenerationWorkflowOutputSchema.optional(),
  'fail-document-generation': documentGenerationWorkflowOutputSchema.optional(),
})

const outputSchema = documentGenerationWorkflowOutputSchema

@Injectable()
export class ResolveDocumentGenerationOutcomeTool {
  readonly function: ReturnType<
    typeof createTool<
      'resolve-document-generation-outcome',
      typeof inputSchema,
      typeof outputSchema
    >
  >

  constructor() {
    this.function = createTool({
      id: 'resolve-document-generation-outcome',
      description: 'Resolve the final approved draft or understandable findings.',
      inputSchema,
      outputSchema,
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
