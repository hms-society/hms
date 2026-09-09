import { Body, Inject, Param, ParseUUIDPipe, Patch, UseGuards } from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'
import { z } from 'zod'
import { createZodDto, ZodValidationPipe } from 'nestjs-zod'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import { SelectCurrentFormalizationDocumentVersionUseCase } from '@hms/core/formalization/use-cases'
import type { FormalizationsRepository } from '@hms/core/formalization/interfaces'
import type {
  DocumentPackagesRepository,
  DocumentVersionsRepository,
  DocumentsRepository,
  PackageDocumentsRepository,
} from '@hms/core/document-production/interfaces'

import { DOCUMENT_PRODUCTION_REPOSITORIES } from '@/document-production/constants/document-production-repositories'
import { FORMALIZATION_REPOSITORIES } from '@/formalization/constants/formalization-repositories'
import { FormalizationsController } from '@/formalization/decorators'
import { FormalizationDocumentVersionResponseDto } from '@/formalization/rest/dtos'
import { CurrentCollaborator } from '@/identity/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'

const selectCurrentVersionSchema = z.object({ versionId: z.uuid() }).strict()
class SelectCurrentBody extends createZodDto(selectCurrentVersionSchema) {}

@FormalizationsController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class SelectCurrentFormalizationDocumentVersionController {
  private readonly useCase: SelectCurrentFormalizationDocumentVersionUseCase

  constructor(
    @Inject(FORMALIZATION_REPOSITORIES.formalizations)
    formalizationsRepository: FormalizationsRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.documentPackages)
    documentPackagesRepository: DocumentPackagesRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.packageDocuments)
    packageDocumentsRepository: PackageDocumentsRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.documents)
    documentsRepository: DocumentsRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.versions)
    versionsRepository: DocumentVersionsRepository,
  ) {
    this.useCase = new SelectCurrentFormalizationDocumentVersionUseCase(
      formalizationsRepository,
      documentPackagesRepository,
      packageDocumentsRepository,
      documentsRepository,
      versionsRepository,
    )
  }

  @Patch(':formalizationId/documents/:documentId/current-version')
  handle(
    @Param('formalizationId', new ParseUUIDPipe()) formalizationId: string,
    @Param('documentId', new ParseUUIDPipe()) documentId: string,
    @Body(new ZodValidationPipe(selectCurrentVersionSchema)) body: SelectCurrentBody,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    return this.useCase
      .execute({
        formalizationId,
        documentId,
        versionId: body.versionId,
        actorId: collaborator.collaboratorId,
        actorProfile: collaborator.profile,
      })
      .then(FormalizationDocumentVersionResponseDto.fromDomain)
  }
}
