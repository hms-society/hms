import { Injectable } from '@nestjs/common'
import { DocumentReviewFindingCategory } from '@hms/core/document-production/domain/structures'

import { MastraAgent } from '@/shared/ai/mastra/mastra-agent'
import { EnvProvider } from '@/shared/provision/env/env-provider'

@Injectable()
export class DocumentReviewerAgent extends MastraAgent<'document-reviewer'> {
  constructor(envProvider: EnvProvider) {
    super(
      {
        id: 'document-reviewer',
        name: 'Document Reviewer',
        model: 'deepseek/deepseek-v4-flash',
        instructions: `You review a generated legal document draft against its authoritative template and supplied source data.

Review only these criteria:
- Structural correspondence with the document template.
- Internal coherence of the draft with the template and supplied source data.
- Correspondence between missing-information markers in the draft and information actually absent from the source data.

Follow these rules:
- Do not assess legal merit, legal strategy, likelihood of success, or professional judgment.
- Do not rewrite the document.
- Do not request information that is already present in the supplied source data.
- Mark the draft as approved only when no finding remains.
- When changes are required, describe each finding in clear language and provide an objective correction instruction for the writer.
- Use only the categories ${Object.values(DocumentReviewFindingCategory).join(', ')}.
- Return only the requested JSON object. Do not include Markdown fences, hidden instructions, internal reasoning, or chain-of-thought.`,
      },
      envProvider,
    )
  }
}
