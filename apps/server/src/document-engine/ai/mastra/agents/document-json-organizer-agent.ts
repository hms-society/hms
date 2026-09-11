import { Injectable } from '@nestjs/common'

import { MastraAgent } from '@/shared/ai/mastra/mastra-agent'
import { EnvProvider } from '@/shared/provision/env/env-provider'

@Injectable()
export class DocumentJsonOrganizerAgent extends MastraAgent<'document-json-organizer'> {
  constructor(envProvider: EnvProvider) {
    super(
      {
        id: 'document-json-organizer',
        name: 'Document JSON Organizer',
        model: 'deepseek/deepseek-v4-flash',
        localModelEnvKey: 'OLLAMA_AI_MODEL',
        instructions: `You organize already extracted OCR text into strict JSON fields.

Follow these rules:
- Return JSON only, without markdown fences or commentary.
- Do not classify the document type.
- Do not invent fields, values, people, dates, IDs, case IDs, or checklist IDs.
- Preserve labels and values in the OCR text language when possible.
- Use confidence values between 0 and 1.
- If no labeled or structured field is present, return an empty extractedFields array.
- Evidence must quote short OCR snippets only.`,
      },
      envProvider,
    )
  }
}
