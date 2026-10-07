import {
  Body,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import type {
  CaseChecklistItemsRepository,
  LegalCasesRepository,
} from '@hms/core/case-management/interfaces'
import {
  GenerateLegalCaseDocumentUseCase,
  GenerateLegalCaseDocumentRevisionUseCase,
  RetryLegalCaseDocumentGenerationUseCase,
} from '@hms/core/case-management/use-cases'
import type { DocumentValidationsRepository } from '@hms/core/document-engine/interfaces'
import type {
  DocumentGenerationsRepository,
  DocumentPackagesRepository,
  DocumentsRepository,
  DocumentSpecificationsRepository,
  PackageDocumentsRepository,
  DocumentVersionsRepository,
} from '@hms/core/document-production/interfaces'
import type { ClientsRepository } from '@hms/core/identity/interfaces'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import {
  generateCaseDocumentRevisionSchema,
  generateCaseDocumentSchema,
} from '@hms/validation/document-production'
import { ZodValidationPipe } from 'nestjs-zod'

import { CASE_MANAGEMENT_REPOSITORIES } from '@/case-management/constants/case-management-repositories'
import { CasesController } from '@/case-management/decorators'
import { DOCUMENT_ENGINE } from '@/document-engine/database/drizzle/constants/documents-repositories'
import { DOCUMENT_PRODUCTION_REPOSITORIES } from '@/document-production/constants/document-production-repositories'
import { CaseDocumentGenerationResponseDto } from '@/document-production/rest/dtos'
import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import { CurrentCollaborator } from '@/identity/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { InngestBroker } from '@/shared/messaging/inngest/inngest-broker'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { IdProvider } from '@/shared/provision/id/id-provider'
import { ErrorResponseDto } from '@/shared/rest/dtos'

@CasesController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class GenerateCaseDocumentController {
  private readonly useCase: GenerateLegalCaseDocumentUseCase
  private readonly retryUseCase: RetryLegalCaseDocumentGenerationUseCase
  private readonly revisionUseCase: GenerateLegalCaseDocumentRevisionUseCase

  constructor(
    @Inject(CASE_MANAGEMENT_REPOSITORIES.legalCases) cases: LegalCasesRepository,
    @Inject(CASE_MANAGEMENT_REPOSITORIES.caseChecklistItems)
    checklist: CaseChecklistItemsRepository,
    @Inject(DOCUMENT_ENGINE.documentValidations)
    validations: DocumentValidationsRepository,
    @Inject(IDENTITY_REPOSITORIES.clients) clients: ClientsRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.documentPackages)
    packages: DocumentPackagesRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.packageDocuments)
    packageDocuments: PackageDocumentsRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.documents) documents: DocumentsRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.specifications)
    specifications: DocumentSpecificationsRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.generations)
    generations: DocumentGenerationsRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.versions)
    versions: DocumentVersionsRepository,
    broker: InngestBroker,
    datetime: DatetimeProvider,
    ids: IdProvider,
  ) {
    this.useCase = new GenerateLegalCaseDocumentUseCase(
      cases,
      checklist,
      validations,
      clients,
      packages,
      packageDocuments,
      documents,
      specifications,
      broker,
      datetime,
      ids,
    )
    this.retryUseCase = new RetryLegalCaseDocumentGenerationUseCase(
      cases,
      packages,
      packageDocuments,
      generations,
      broker,
      datetime,
      ids,
    )
    this.revisionUseCase = new GenerateLegalCaseDocumentRevisionUseCase(
      cases,
      packages,
      packageDocuments,
      generations,
      versions,
      broker,
      datetime,
      ids,
    )
  }

  @Post(':caseId/documents/generations')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiResponse({ status: HttpStatus.ACCEPTED, type: CaseDocumentGenerationResponseDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.CONFLICT, type: ErrorResponseDto })
  handle(
    @Param('caseId', new ParseUUIDPipe()) caseId: string,
    @Body(new ZodValidationPipe(generateCaseDocumentSchema)) body: {
      documentSpecificationId: string
      documentFileIds: string[]
      instructions?: string
    },
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ): Promise<CaseDocumentGenerationResponseDto> {
    return this.useCase.execute({
      ...body,
      caseId,
      requestedByCollaboratorId: collaborator.collaboratorId,
      requestedByCollaboratorProfile: collaborator.profile,
    })
  }

  @Post(':caseId/documents/:documentId/generations/retry')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiResponse({ status: HttpStatus.ACCEPTED, type: CaseDocumentGenerationResponseDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.CONFLICT, type: ErrorResponseDto })
  handleRetry(
    @Param('caseId', new ParseUUIDPipe()) caseId: string,
    @Param('documentId', new ParseUUIDPipe()) documentId: string,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ): Promise<CaseDocumentGenerationResponseDto> {
    return this.retryUseCase.execute({
      caseId,
      documentId,
      requestedByCollaboratorId: collaborator.collaboratorId,
      requestedByCollaboratorProfile: collaborator.profile,
    })
  }

  @Post(':caseId/documents/:documentId/versions/:sourceDocumentVersionId/generations')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiResponse({ status: HttpStatus.ACCEPTED, type: CaseDocumentGenerationResponseDto })
  handleRevision(
    @Param('caseId', new ParseUUIDPipe()) caseId: string,
    @Param('documentId', new ParseUUIDPipe()) documentId: string,
    @Param('sourceDocumentVersionId', new ParseUUIDPipe())
    sourceDocumentVersionId: string,
    @Body(new ZodValidationPipe(generateCaseDocumentRevisionSchema)) body: {
      instructions: string
    },
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ): Promise<CaseDocumentGenerationResponseDto> {
    return this.revisionUseCase.execute({
      caseId,
      documentId,
      sourceDocumentVersionId,
      instructions: body.instructions,
      requestedByCollaboratorId: collaborator.collaboratorId,
      requestedByCollaboratorProfile: collaborator.profile,
    })
  }
}
