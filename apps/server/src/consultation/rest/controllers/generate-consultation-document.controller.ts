import {
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import type { ConsultationsRepository } from '@hms/core/consultation/interfaces'
import { GenerateConsultationDocumentUseCase } from '@hms/core/consultation/use-cases'
import type {
  DocumentGenerationsRepository,
  DocumentPackagesRepository,
  PackageDocumentsRepository,
} from '@hms/core/document-production/interfaces'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import type { ClientsRepository } from '@hms/core/identity/interfaces'
import type { IntakesRepository } from '@hms/core/intake/interfaces'
import type { LegalExpertiseCatalogProvider } from '@hms/core/legal-catalog/interfaces'

import { CONSULTATION_REPOSITORIES } from '@/consultation/constants/consultation-repositories'
import { ConsultationsController } from '@/consultation/decorators'
import { ConsultationDocumentGenerationResponseDto } from '@/consultation/rest/dtos'
import { DOCUMENT_PRODUCTION_REPOSITORIES } from '@/document-production/constants/document-production-repositories'
import { CurrentCollaborator } from '@/identity/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import { INTAKE_REPOSITORIES } from '@/intake/constants/intake-repositories'
import { LEGAL_CATALOG_PROVIDERS } from '@/legal-catalog/constants/legal-catalog-providers'
import { InngestBroker } from '@/shared/messaging/inngest/inngest-broker'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { IdProvider } from '@/shared/provision/id/id-provider'
import { ErrorResponseDto } from '@/shared/rest/dtos'

@ConsultationsController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class GenerateConsultationDocumentController {
  private readonly useCase: GenerateConsultationDocumentUseCase

  constructor(
    @Inject(CONSULTATION_REPOSITORIES.consultations)
    consultationsRepository: ConsultationsRepository,
    @Inject(INTAKE_REPOSITORIES.intakes) intakesRepository: IntakesRepository,
    @Inject(IDENTITY_REPOSITORIES.clients) clientsRepository: ClientsRepository,
    @Inject(LEGAL_CATALOG_PROVIDERS.legalExpertiseCatalog)
    legalExpertiseCatalogProvider: LegalExpertiseCatalogProvider,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.documentPackages)
    documentPackagesRepository: DocumentPackagesRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.packageDocuments)
    packageDocumentsRepository: PackageDocumentsRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.generations)
    generationsRepository: DocumentGenerationsRepository,
    broker: InngestBroker,
    datetimeProvider: DatetimeProvider,
    idProvider: IdProvider,
  ) {
    this.useCase = new GenerateConsultationDocumentUseCase(
      consultationsRepository,
      intakesRepository,
      clientsRepository,
      legalExpertiseCatalogProvider,
      documentPackagesRepository,
      packageDocumentsRepository,
      generationsRepository,
      broker,
      datetimeProvider,
      idProvider,
    )
  }

  @Post(':consultationId/documents/:documentId/generations')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description: 'The document generation was requested successfully.',
    type: ConsultationDocumentGenerationResponseDto,
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.CONFLICT, type: ErrorResponseDto })
  handle(
    @Param('consultationId', new ParseUUIDPipe()) consultationId: string,
    @Param('documentId', new ParseUUIDPipe()) documentId: string,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ): Promise<ConsultationDocumentGenerationResponseDto> {
    return this.useCase.execute({
      consultationId,
      documentId,
      requestedByCollaboratorId: collaborator.collaboratorId,
    })
  }
}
