import { Module } from '@nestjs/common'

import { DOCUMENT_VALIDATION_PROVIDERS } from '../constants/document-validation-providers'
import { MockDocumentValidationAnalyzerProvider } from './mock-document-validation-analyzer-provider'

@Module({
  providers: [
    MockDocumentValidationAnalyzerProvider,
    {
      provide: DOCUMENT_VALIDATION_PROVIDERS.analyzer,
      useExisting: MockDocumentValidationAnalyzerProvider,
    },
  ],
  exports: [DOCUMENT_VALIDATION_PROVIDERS.analyzer],
})
export class DocumentEngineProvisionModule {}
