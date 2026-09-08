import { Body, Inject, Param, ParseUUIDPipe, Patch, UseGuards } from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'
import { createZodDto, ZodValidationPipe } from 'nestjs-zod'
import { saveFormalizationDocumentVersionSchema } from '@hms/validation/formalization'
import {
  GetFormalizationDocumentVersionUseCase,
  SaveManualFormalizationDocumentVersionUseCase,
} from '@hms/core/formalization/use-cases'
import type { DocumentTemplateContent } from '@hms/core/document-production/domain/structures'
import type {
  DocumentFileExporter,
  DocumentPackagesRepository,
  DocumentVersionsRepository,
  DocumentsRepository,
  PackageDocumentsRepository,
} from '@hms/core/document-production/interfaces'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import type { FileStorageProvider } from '@hms/core/shared/interfaces'
import type { FormalizationsRepository } from '@hms/core/formalization/interfaces'

import { DOCUMENT_PRODUCTION_PROVIDERS } from '@/document-production/constants/document-production-providers'
import { DOCUMENT_PRODUCTION_REPOSITORIES } from '@/document-production/constants/document-production-repositories'
import { FORMALIZATION_REPOSITORIES } from '@/formalization/constants/formalization-repositories'
import { FormalizationsController } from '@/formalization/decorators'
import { FormalizationDocumentVersionResponseDto } from '@/formalization/rest/dtos'
import { CurrentCollaborator } from '@/identity/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { PROVISION_PROVIDERS } from '@/shared/provision/constants/provision-providers'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { IdProvider } from '@/shared/provision/id/id-provider'

class SaveManualBody extends createZodDto(saveFormalizationDocumentVersionSchema) {}

@FormalizationsController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class SaveManualFormalizationDocumentVersionController {
  private readonly getVersionUseCase: GetFormalizationDocumentVersionUseCase
  private readonly useCase: SaveManualFormalizationDocumentVersionUseCase

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
    @Inject(DOCUMENT_PRODUCTION_PROVIDERS.documentFileExporter)
    documentFileExporter: DocumentFileExporter,
    @Inject(PROVISION_PROVIDERS.fileStorage)
    fileStorageProvider: FileStorageProvider,
    datetimeProvider: DatetimeProvider,
    idProvider: IdProvider,
  ) {
    this.getVersionUseCase = new GetFormalizationDocumentVersionUseCase(
      formalizationsRepository,
      documentPackagesRepository,
      packageDocumentsRepository,
      versionsRepository,
    )
    this.useCase = new SaveManualFormalizationDocumentVersionUseCase(
      formalizationsRepository,
      documentPackagesRepository,
      packageDocumentsRepository,
      documentsRepository,
      versionsRepository,
      documentFileExporter,
      fileStorageProvider,
      datetimeProvider,
      idProvider,
    )
  }

  @Patch(':formalizationId/document-versions/:versionId')
  handle(
    @Param('formalizationId', new ParseUUIDPipe()) formalizationId: string,
    @Param('versionId', new ParseUUIDPipe()) versionId: string,
    @Body(new ZodValidationPipe(saveFormalizationDocumentVersionSchema))
    body: SaveManualBody,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    return this.getVersionUseCase
      .execute({
        formalizationId,
        versionId,
        actorId: collaborator.collaboratorId,
        actorProfile: collaborator.profile,
      })
      .then((version) =>
        this.useCase.execute({
          formalizationId,
          documentId: version.documentId,
          sourceDocumentVersionId: body.sourceDocumentVersionId,
          actorId: collaborator.collaboratorId,
          content: body.content as DocumentTemplateContent,
          actorProfile: collaborator.profile,
        }),
      )
      .then(FormalizationDocumentVersionResponseDto.fromDomain)
  }
}
