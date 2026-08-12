import {
  Body,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import type { ConsultationsRepository } from '@hms/core/consultation/interfaces'
import { ReviewConsultationDocumentVersionUseCase } from '@hms/core/consultation/use-cases'
import type {
  DocumentPackagesRepository,
  DocumentVersionsRepository,
  PackageDocumentsRepository,
} from '@hms/core/document-production/interfaces'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import { reviewDocumentVersionSchema } from '@hms/validation/document-production'
import { ZodValidationPipe } from 'nestjs-zod'

import { CONSULTATION_REPOSITORIES } from '@/consultation/constants/consultation-repositories'
import { ConsultationsController } from '@/consultation/decorators'
import { ReviewConsultationDocumentVersionResponseDto } from '@/consultation/rest/dtos'
import { DOCUMENT_PRODUCTION_REPOSITORIES } from '@/document-production/constants/document-production-repositories'
import { CurrentCollaborator } from '@/identity/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'

type RequestBody = Omit<
  Parameters<ReviewConsultationDocumentVersionUseCase['execute']>[0],
  'consultationId' | 'documentId' | 'documentVersionId' | 'reviewedByCollaboratorId'
>

@ConsultationsController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class ReviewConsultationDocumentVersionController {
  private readonly useCase: ReviewConsultationDocumentVersionUseCase

  constructor(
    @Inject(CONSULTATION_REPOSITORIES.consultations)
    consultationsRepository: ConsultationsRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.documentPackages)
    documentPackagesRepository: DocumentPackagesRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.packageDocuments)
    packageDocumentsRepository: PackageDocumentsRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.versions)
    versionsRepository: DocumentVersionsRepository,
    datetimeProvider: DatetimeProvider,
  ) {
    this.useCase = new ReviewConsultationDocumentVersionUseCase(
      consultationsRepository,
      documentPackagesRepository,
      packageDocumentsRepository,
      versionsRepository,
      datetimeProvider,
    )
  }

  @Patch(':consultationId/documents/:documentId/versions/:documentVersionId/review')
  @ApiResponse({
    status: HttpStatus.OK,
    type: ReviewConsultationDocumentVersionResponseDto,
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.CONFLICT, type: ErrorResponseDto })
  handle(
    @Param('consultationId', new ParseUUIDPipe()) consultationId: string,
    @Param('documentId', new ParseUUIDPipe()) documentId: string,
    @Param('documentVersionId', new ParseUUIDPipe()) documentVersionId: string,
    @Body(new ZodValidationPipe(reviewDocumentVersionSchema)) body: RequestBody,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    return this.useCase
      .execute({
        consultationId,
        documentId,
        documentVersionId,
        reviewedByCollaboratorId: collaborator.collaboratorId,
        decision: body.decision,
        rejectionReason: 'rejectionReason' in body ? body.rejectionReason : undefined,
      })
      .then(ReviewConsultationDocumentVersionResponseDto.fromDomain)
  }
}
