import {
  Body,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Put,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import type { ConsultationsRepository } from '@hms/core/consultation/interfaces'
import { ReplaceConsultationDocumentSelectionUseCase } from '@hms/core/consultation/use-cases'
import type {
  DocumentPackagesRepository,
  DocumentSpecificationsRepository,
  DocumentVersionsRepository,
  DocumentsRepository,
  PackageDocumentsRepository,
} from '@hms/core/document-production/interfaces'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import { replaceConsultationDocumentSelectionSchema } from '@hms/validation/document-production'
import { ZodValidationPipe } from 'nestjs-zod'

import { CONSULTATION_REPOSITORIES } from '@/consultation/constants/consultation-repositories'
import { ConsultationsController } from '@/consultation/decorators'
import {
  ConsultationDocumentSelectionResponseDto,
  ReplaceConsultationDocumentSelectionRequestDto,
} from '@/consultation/rest/dtos'
import { DOCUMENT_PRODUCTION_REPOSITORIES } from '@/document-production/constants/document-production-repositories'
import { CurrentCollaborator } from '@/identity/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { IdProvider } from '@/shared/provision/id/id-provider'
import { ErrorResponseDto } from '@/shared/rest/dtos'

type RequestBody = ReplaceConsultationDocumentSelectionRequestDto

@ConsultationsController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class ReplaceConsultationDocumentSelectionController {
  private readonly useCase: ReplaceConsultationDocumentSelectionUseCase

  constructor(
    @Inject(CONSULTATION_REPOSITORIES.consultations)
    consultationsRepository: ConsultationsRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.specifications)
    documentSpecificationsRepository: DocumentSpecificationsRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.documentPackages)
    documentPackagesRepository: DocumentPackagesRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.packageDocuments)
    packageDocumentsRepository: PackageDocumentsRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.documents)
    documentsRepository: DocumentsRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.versions)
    documentVersionsRepository: DocumentVersionsRepository,
    idProvider: IdProvider,
  ) {
    this.useCase = new ReplaceConsultationDocumentSelectionUseCase(
      consultationsRepository,
      documentSpecificationsRepository,
      documentPackagesRepository,
      packageDocumentsRepository,
      documentsRepository,
      documentVersionsRepository,
      idProvider,
    )
  }

  @Put(':consultationId/documents/selection')
  @ApiResponse({ status: HttpStatus.OK, type: ConsultationDocumentSelectionResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorResponseDto })
  handle(
    @Param('consultationId', new ParseUUIDPipe()) consultationId: string,
    @Body(new ZodValidationPipe(replaceConsultationDocumentSelectionSchema))
    body: RequestBody,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    return this.useCase
      .execute({
        consultationId,
        collaboratorId: collaborator.collaboratorId,
        collaboratorProfile: collaborator.profile,
        documentSpecificationIds: body.documentSpecificationIds,
      })
      .then(ConsultationDocumentSelectionResponseDto.fromDomain)
  }
}
