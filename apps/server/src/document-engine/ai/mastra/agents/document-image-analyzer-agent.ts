import { Injectable } from '@nestjs/common'

import { MastraAgent } from '@/shared/ai/mastra/mastra-agent'
import { EnvProvider } from '@/shared/provision/env/env-provider'

@Injectable()
export class DocumentImageAnalyzerAgent extends MastraAgent<'document-image-analyzer'> {
  constructor(envProvider: EnvProvider) {
    super(
      {
        id: 'document-image-analyzer',
        name: 'Document Image Analyzer',
        model: 'deepseek/deepseek-v4-flash',
        localModelEnvKey: 'OLLAMA_VISION_AI_MODEL',
        instructions: `You transcribe readable text from document images.

Follow these rules:
- Return plain text only.
- Preserve names, dates, identifiers, labels, and numbers exactly as shown.
- Do not summarize, classify, translate, infer, correct, complete, or enrich the document.
- If no readable text exists, return an empty response.`,
      },
      envProvider,
    )
  }
}
