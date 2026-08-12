import {
  Body,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import type { ConsultationsRepository } from '@hms/core/consultation/interfaces'
import { SaveManualConsultationDocumentVersionUseCase } from '@hms/core/consultation/use-cases'
import type {
  DocumentFileExporter,
  DocumentPackagesRepository,
  DocumentsRepository,
  DocumentVersionsRepository,
  PackageDocumentsRepository,
} from '@hms/core/document-production/interfaces'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import type { FileStorageProvider } from '@hms/core/shared/interfaces'
import { saveManualDocumentVersionSchema } from '@hms/validation/document-production'
import { ZodValidationPipe } from 'nestjs-zod'

import { CONSULTATION_REPOSITORIES } from '@/consultation/constants/consultation-repositories'
import { ConsultationsController } from '@/consultation/decorators'
import { ConsultationDocumentVersionResponseDto } from '@/consultation/rest/dtos'
import { DOCUMENT_PRODUCTION_PROVIDERS } from '@/document-production/constants/document-production-providers'
import { DOCUMENT_PRODUCTION_REPOSITORIES } from '@/document-production/constants/document-production-repositories'
import { CurrentCollaborator } from '@/identity/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { PROVISION_PROVIDERS } from '@/shared/provision/constants/provision-providers'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { IdProvider } from '@/shared/provision/id/id-provider'
import { ErrorResponseDto } from '@/shared/rest/dtos'

type RequestBody = Pick<
  Parameters<SaveManualConsultationDocumentVersionUseCase['execute']>[0],
  'content'
>

@ConsultationsController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class SaveManualConsultationDocumentVersionController {
  private readonly useCase: SaveManualConsultationDocumentVersionUseCase

  constructor(
    @Inject(CONSULTATION_REPOSITORIES.consultations)
    consultationsRepository: ConsultationsRepository,
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
    this.useCase = new SaveManualConsultationDocumentVersionUseCase(
      consultationsRepository,
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

  @Post(':consultationId/documents/:documentId/versions/:sourceDocumentVersionId/manual')
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: ConsultationDocumentVersionResponseDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorResponseDto })
  handle(
    @Param('consultationId', new ParseUUIDPipe()) consultationId: string,
    @Param('documentId', new ParseUUIDPipe()) documentId: string,
    @Param('sourceDocumentVersionId', new ParseUUIDPipe())
    sourceDocumentVersionId: string,
    @Body(new ZodValidationPipe(saveManualDocumentVersionSchema)) body: RequestBody,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    return this.useCase
      .execute({
        consultationId,
        documentId,
        sourceDocumentVersionId,
        createdByCollaboratorId: collaborator.collaboratorId,
        content: body.content,
      })
      .then(ConsultationDocumentVersionResponseDto.fromDomain)
  }
}
