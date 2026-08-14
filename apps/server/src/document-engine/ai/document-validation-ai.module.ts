import { Module } from '@nestjs/common'

import { DOCUMENT_VALIDATION_PROVIDERS } from '@/document-engine/constants/document-validation-providers'
import { ProvisionModule } from '@/shared/provision/provision.module'
import { DocumentValidationAiAnalyzerProvider } from './document-validation-ai-analyzer-provider'
import { DocumentValidationAgent } from './mastra/agents'

@Module({
  imports: [ProvisionModule],
  providers: [
    DocumentValidationAgent,
    DocumentValidationAiAnalyzerProvider,
    {
      provide: DOCUMENT_VALIDATION_PROVIDERS.analyzer,
      useExisting: DocumentValidationAiAnalyzerProvider,
    },
  ],
  exports: [DOCUMENT_VALIDATION_PROVIDERS.analyzer],
})
export class DocumentValidationAiModule {}
