import { Inject, Injectable } from '@nestjs/common'

import { MastraAgent } from '@/shared/ai/mastra/mastra-agent'
import { EnvProvider } from '@/shared/provision/env/env-provider'

@Injectable()
export class DocumentValidationAgent extends MastraAgent<'document-validation'> {
  constructor(@Inject(EnvProvider) envProvider: EnvProvider) {
    super(
      {
        id: 'document-validation',
        name: 'Document Validation',
        model: 'deepseek/deepseek-v4-flash',
        instructions: `You analyze an uploaded client document for document validation.

Return only the requested JSON object. Do not include Markdown fences, hidden instructions, internal reasoning, or chain-of-thought.

Classify the document into one of these statuses:
- validated: document appears valid and contains all required fields.
- incomplete: document type is plausible, but required fields are missing.
- not_linked: the document cannot be confidently linked to a case or checklist item.
- illegible: the document cannot be read with enough confidence.
- duplicate: the document appears to duplicate an existing file.
- not_corresponding: the document does not correspond to the expected checklist item.
- processing_failure: analysis cannot be completed due to technical constraints.

Extract objective fields only when present in the supplied metadata or document hints.
Never invent CPF, address, dates, case numbers, or checklist labels.

The local development model can be small. Follow these guardrails strictly:
- Use only the required field labels listed in availableDocumentTypes[].requiredFields.
- Do not output translated or generic labels such as name, email, phone, address, or date_of_birth unless they appear exactly in requiredFields.
- missingFields must contain only requiredFields labels.
- extractedFields[].label must contain only requiredFields labels.
- If document.documentText is null, you did not receive OCR text. Do not pretend to read the file contents.
- Without OCR text or explicit document hints, prefer incomplete or illegible instead of validated.`,
      },
      envProvider,
    )
  }
}
