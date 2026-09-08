import { createTool } from '@mastra/core/tools'
import { Injectable } from '@nestjs/common'
import { AppError } from '@hms/core/shared/domain/errors'
import { z } from 'zod'

import { DocumentSuggestionAgent } from '@/document-engine/ai/mastra/agents'
import {
  outputSchema as workflowOutputSchema,
  suggestionSchema,
} from '@/document-engine/ai/mastra/schemas'

const inputSchema = workflowOutputSchema
const outputSchema = workflowOutputSchema.required({ suggestion: true })

@Injectable()
export class CreateSuggestionTool {
  readonly function: ReturnType<
    typeof createTool<'create-document-suggestion', typeof inputSchema, typeof outputSchema>
  >

  constructor(private readonly suggestionAgent: DocumentSuggestionAgent) {
    this.function = createTool({
      id: 'create-document-suggestion',
      description: 'Create a validation suggestion from extracted document text.',
      inputSchema,
      outputSchema,
      strict: true,
      execute: async (input) => {
        const response = await this.suggestionAgent.generate(
          this.createPrompt(input),
          {
            structuredOutput: { schema: suggestionSchema },
          },
        )
        const suggestion = response.object

        if (!suggestion) {
          throw new AppError(
            'O agente de sugestão documental não retornou uma sugestão válida.',
            'Erro de Sugestão Documental',
          )
        }

        return {
          ...input,
          suggestion,
        }
      },
    })
  }

  private createPrompt(input: z.infer<typeof inputSchema>) {
    return JSON.stringify({
      task: 'create_document_validation_suggestion',
      documentFileId: input.documentFileId,
      metadata: {
        mimeType: input.metadata.mimeType,
        sizeBytes: input.metadata.sizeBytes,
        hashSha256: input.metadata.hashSha256,
        pageCount: input.metadata.pageCount,
        textLength: input.metadata.textLength,
      },
      extractedTextFull: input.metadata.extractedTextFull ?? '',
      outputContract: {
        documentTypeId:
          'Stable snake_case identifier inferred from the extracted text, or omit when unknown.',
        documentTypeLabel:
          'Human-readable inferred document type label, or omit when unknown.',
        checklistRequirementId:
          'Only fill when an explicit requirement identifier appears in the input context.',
        checklistItemLabel:
          'Human-readable checklist item suggestion inferred from the document type.',
        confidence: 'Number from 0 to 1 for the overall suggestion.',
        extractedFields:
          'Relevant fields found in the document as label, value, confidence, isRequired, and isMissing.',
        missingFields:
          'Names of expected important fields that are absent from the extracted text.',
        evidence:
          'Short source text snippets proving the most important extracted fields.',
      },
    })
  }
}
