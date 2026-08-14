import { createTool } from '@mastra/core/tools'
import { Inject, Injectable } from '@nestjs/common'
import type { DocumentVersion } from '@hms/core/document-production/domain/entities'
import {
  DocumentReviewDecision,
  type DocumentTemplateContent,
} from '@hms/core/document-production/domain/structures'
import type {
  DocumentFileExporter,
  DocumentGenerationsRepository,
  DocumentVersionsRepository,
} from '@hms/core/document-production/interfaces'
import {
  CompleteDocumentGenerationUseCase,
  SaveGeneratedDocumentVersionUseCase,
} from '@hms/core/document-production/use-cases'
import type { FileStorageProvider } from '@hms/core/shared/interfaces'
import { z } from 'zod'

import {
  documentDraftSchema,
  documentReviewCycleOutputSchema,
} from '@/document-production/ai/mastra/schemas'
import { DOCUMENT_PRODUCTION_PROVIDERS } from '@/document-production/constants/document-production-providers'
import { DOCUMENT_PRODUCTION_REPOSITORIES } from '@/document-production/constants/document-production-repositories'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { PROVISION_PROVIDERS } from '@/shared/provision/constants/provision-providers'

const inputSchema = documentReviewCycleOutputSchema

const outputSchema = z.object({
  status: z.literal(DocumentReviewDecision.Approved),
  documentGenerationId: z.string().uuid(),
  documentVersionId: z.string().uuid(),
  attemptsCount: z.number().int().min(1).max(3),
  draft: documentDraftSchema,
  pendingMarkers: z.array(
    z.object({ marker: z.string().regex(/^\{[a-z][a-z0-9_]*\}$/) }),
  ),
})

@Injectable()
export class SaveGeneratedDocumentVersionTool {
  readonly function: ReturnType<
    typeof createTool<
      'save-generated-document-version',
      typeof inputSchema,
      typeof outputSchema
    >
  >

  constructor(
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.generations)
    generationsRepository: DocumentGenerationsRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.versions)
    versionsRepository: DocumentVersionsRepository,
    @Inject(DOCUMENT_PRODUCTION_PROVIDERS.documentFileExporter)
    documentFileExporter: DocumentFileExporter,
    @Inject(PROVISION_PROVIDERS.fileStorage)
    fileStorageProvider: FileStorageProvider,
    datetimeProvider: DatetimeProvider,
  ) {
    const saveVersionUseCase = new SaveGeneratedDocumentVersionUseCase(
      generationsRepository,
      versionsRepository,
      documentFileExporter,
      fileStorageProvider,
      datetimeProvider,
    )
    const completeGenerationUseCase = new CompleteDocumentGenerationUseCase(
      generationsRepository,
      datetimeProvider,
    )

    this.function = createTool({
      id: 'save-generated-document-version',
      description:
        'Export and persist an AI-generated document draft as an immutable version.',
      inputSchema,
      outputSchema,
      strict: true,
      execute: async (input) => {
        const version = await saveVersionUseCase.execute({
          documentGenerationId: input.documentGenerationId,
          content: input.draft.content as unknown as DocumentTemplateContent,
          pendingMarkers: input.pendingMarkers,
        })
        await completeGenerationUseCase.execute({
          documentGenerationId: input.documentGenerationId,
          documentVersionId: version.id,
          attemptsCount: input.attemptsCount,
        })

        return this.serializeVersion(version, input)
      },
    })
  }

  private serializeVersion(version: DocumentVersion, input: z.infer<typeof inputSchema>) {
    return {
      status: DocumentReviewDecision.Approved,
      documentGenerationId: input.documentGenerationId,
      documentVersionId: version.id,
      attemptsCount: input.attemptsCount,
      draft: input.draft,
      pendingMarkers: input.pendingMarkers,
    }
  }
}
