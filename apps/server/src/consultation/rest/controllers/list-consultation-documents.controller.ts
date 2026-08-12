import { Get, HttpStatus, Inject, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import type { ConsultationsRepository } from '@hms/core/consultation/interfaces'
import { ListConsultationDocumentsUseCase } from '@hms/core/consultation/use-cases'
import type {
  DocumentPackagesRepository,
  DocumentsRepository,
  DocumentVersionsRepository,
  PackageDocumentsRepository,
} from '@hms/core/document-production/interfaces'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'

import { CONSULTATION_REPOSITORIES } from '@/consultation/constants/consultation-repositories'
import { ConsultationsController } from '@/consultation/decorators'
import { ListConsultationDocumentsResponseDto } from '@/consultation/rest/dtos'
import { DOCUMENT_PRODUCTION_REPOSITORIES } from '@/document-production/constants/document-production-repositories'
import { CurrentCollaborator } from '@/identity/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { ErrorResponseDto } from '@/shared/rest/dtos'

@ConsultationsController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class ListConsultationDocumentsController {
  private readonly useCase: ListConsultationDocumentsUseCase

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
  ) {
    this.useCase = new ListConsultationDocumentsUseCase(
      consultationsRepository,
      documentPackagesRepository,
      packageDocumentsRepository,
      documentsRepository,
      versionsRepository,
    )
  }

  @Get(':consultationId/documents')
  @ApiResponse({
    status: HttpStatus.OK,
    type: [ListConsultationDocumentsResponseDto],
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorResponseDto })
  async handle(
    @Param('consultationId', new ParseUUIDPipe()) consultationId: string,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    const documents = await this.useCase.execute({
      consultationId,
      collaboratorId: collaborator.collaboratorId,
    })
    return documents.map(ListConsultationDocumentsResponseDto.fromDomain)
  }
}
