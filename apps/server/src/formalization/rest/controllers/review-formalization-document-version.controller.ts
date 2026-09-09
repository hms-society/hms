import { Body, Inject, Param, ParseUUIDPipe, Patch, UseGuards } from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'
import { createZodDto, ZodValidationPipe } from 'nestjs-zod'
import { reviewFormalizationDocumentVersionSchema } from '@hms/validation/formalization'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import { ReviewFormalizationDocumentVersionUseCase } from '@hms/core/formalization/use-cases'
import type { FormalizationsRepository } from '@hms/core/formalization/interfaces'
import type {
  DocumentPackagesRepository,
  DocumentVersionsRepository,
  PackageDocumentsRepository,
} from '@hms/core/document-production/interfaces'

import { FORMALIZATION_REPOSITORIES } from '@/formalization/constants/formalization-repositories'
import { DOCUMENT_PRODUCTION_REPOSITORIES } from '@/document-production/constants/document-production-repositories'
import { FormalizationsController } from '@/formalization/decorators'
import { FormalizationDocumentVersionResponseDto } from '@/formalization/rest/dtos'
import { CurrentCollaborator } from '@/identity/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'

class ReviewBody extends createZodDto(reviewFormalizationDocumentVersionSchema) {}

@FormalizationsController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class ReviewFormalizationDocumentVersionController {
  private readonly useCase: ReviewFormalizationDocumentVersionUseCase

  constructor(
    @Inject(FORMALIZATION_REPOSITORIES.formalizations)
    formalizationsRepository: FormalizationsRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.documentPackages)
    documentPackagesRepository: DocumentPackagesRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.packageDocuments)
    packageDocumentsRepository: PackageDocumentsRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.versions)
    versionsRepository: DocumentVersionsRepository,
    datetimeProvider: DatetimeProvider,
  ) {
    this.useCase = new ReviewFormalizationDocumentVersionUseCase(
      formalizationsRepository,
      documentPackagesRepository,
      packageDocumentsRepository,
      versionsRepository,
      datetimeProvider,
    )
  }

  @Patch(':formalizationId/document-versions/:versionId/review')
  handle(
    @Param('formalizationId', new ParseUUIDPipe()) formalizationId: string,
    @Param('versionId', new ParseUUIDPipe()) versionId: string,
    @Body(new ZodValidationPipe(reviewFormalizationDocumentVersionSchema))
    body: ReviewBody,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    return this.useCase
      .execute({
        formalizationId,
        versionId,
        actorId: collaborator.collaboratorId,
        ...body,
        actorProfile: collaborator.profile,
      })
      .then(FormalizationDocumentVersionResponseDto.fromDomain)
  }
}
