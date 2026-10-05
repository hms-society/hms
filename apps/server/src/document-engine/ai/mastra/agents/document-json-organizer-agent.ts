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
        instructions: `You organize already extracted text into structured JSON fields. The input may come from OCR, selectable PDF text, flattened tables, or text with lost line breaks.

Follow these rules:
- Return JSON only, without markdown fences or commentary.
- Do not classify the document type.
- Do not invent fields, values, people, dates, IDs, case IDs, or checklist IDs.
- Extract every field whose label and complete value can be identified from the source.
- Do not require a colon, line break, or one-field-per-line formatting. Labels and values may be adjacent in flattened tables or paragraphs.
- Keep each value complete and stop it at the next identifiable field label. Never move words between adjacent fields or combine neighboring rows.
- Evidence must quote an exact, contiguous source span containing the field label and only that field's complete value; the source span need not contain a colon.
- Use surrounding labels, section structure, and document context to identify boundaries, but never use context to invent or complete a value.
- Never use a document title or section heading as the label for following content.
- Stop each value before the next labeled field; never combine adjacent table rows.
- If a value is genuinely uncertain, include it only when the source span still supports the proposed value; lower its confidence. Do not guess between conflicting values.
- Preserve line and page boundaries when present, but also organize flattened text.
- Preserve labels and values in the OCR text language when possible.
- Use confidence values between 0 and 1.
- If no field can be safely confirmed, return an empty extractedFields array and evidence array.`,
      },
      envProvider,
    )
  }
}
