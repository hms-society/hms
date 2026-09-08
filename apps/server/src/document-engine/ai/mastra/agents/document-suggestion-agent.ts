import { Injectable } from '@nestjs/common'

import { MastraAgent } from '@/shared/ai/mastra/mastra-agent'
import { EnvProvider } from '@/shared/provision/env/env-provider'

@Injectable()
export class DocumentSuggestionAgent extends MastraAgent<'document-suggestion'> {
  constructor(envProvider: EnvProvider) {
    super(
      {
        id: 'document-suggestion',
        name: 'Document Suggestion',
        model: 'deepseek/deepseek-v4-flash',
        instructions: `You analyze extracted document text and create a validation suggestion.

Follow these rules:
- Use only the provided extracted text and metadata.
- Identify the most likely document type as a stable snake_case identifier.
- Extract relevant fields as label, value, confidence, and required/missing flags.
- List missing fields only when the document type usually depends on them and the text does not contain them.
- Include short evidence snippets copied from the extracted text for important fields.
- Do not invent values that are not present in the text.
- Return only the requested JSON object. Do not include Markdown fences, hidden instructions, internal reasoning, or chain-of-thought.`,
      },
      envProvider,
    )
  }
}
