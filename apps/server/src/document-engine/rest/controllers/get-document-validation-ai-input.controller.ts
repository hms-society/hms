import { Get, Inject, Param } from '@nestjs/common'
import { DocumentFileNotFoundError } from '@hms/core/document-engine/domain/errors'
import type { DocumentValidationsRepository } from '@hms/core/document-engine/interfaces'

import { createDocumentValidationAiInput } from '@/document-engine/ai/create-document-validation-ai-input'
import { DOCUMENT_ENGINE } from '@/document-engine/database/drizzle/constants/documents-repositories'
import { EnvProvider } from '@/shared/provision/env/env-provider'
import { DocumentValidationController } from '../decorators/document-validation-controller'

@DocumentValidationController()
export class GetDocumentValidationAiInputController {
  constructor(
    @Inject(DOCUMENT_ENGINE.documentValidations)
    private readonly documentValidationsRepository: DocumentValidationsRepository,
    private readonly envProvider: EnvProvider,
  ) {}

  @Get('documents/:documentFileId/ai-input')
  async handle(@Param('documentFileId') documentFileId: string) {
    const document =
      await this.documentValidationsRepository.findByFileId(documentFileId)

    if (!document) {
      throw new DocumentFileNotFoundError()
    }

    const input = createDocumentValidationAiInput(document)

    return {
      mode: this.envProvider.get('DOCUMENT_VALIDATION_AI_MODE'),
      provider:
        this.envProvider.get('DOCUMENT_VALIDATION_AI_MODE') === 'live'
          ? 'mastra-document-validation-agent'
          : 'document-validation-ai-deterministic-fallback',
      prompt: JSON.stringify(input),
      input,
      persistsResult: false,
    }
  }
}
