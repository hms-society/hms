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
- Extract a field only when its label and complete value are explicit in the OCR text.
- Never split a value across adjacent fields or move words between fields.
- Evidence must quote the exact source text, including the label and complete value.
- Treat each OCR line formatted as "Label: Value" as one field candidate.
- Never use a document title or section heading as the label for following content.
- Stop each value before the next labeled field; never combine adjacent table rows.
- Omit any field whose boundary or complete value is ambiguous.
- Preserve line and page boundaries as clues; do not combine nearby text by guesswork.
- Preserve labels and values in the OCR text language when possible.
- Use confidence values between 0 and 1.
- If no field can be safely confirmed, return an empty extractedFields array and evidence array.`,
      },
      envProvider,
    )
  }
}
