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
import type { ReviewCaseDocumentVersionUseCase } from '@hms/core/document-production/use-cases'
import { ReviewCaseDocumentVersionUseCase as ReviewCaseDocumentVersionUseCaseClass } from '@hms/core/document-production/use-cases'
import type { DocumentVersionsRepository } from '@hms/core/document-production/interfaces'
import type {
  CaseMembersRepository,
  LegalCasesRepository,
} from '@hms/core/case-management/interfaces'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import { reviewDocumentVersionSchema } from '@hms/validation/document-production'
import { ZodValidationPipe } from 'nestjs-zod'

import { CasesController } from '@/case-management/decorators'
import { CASE_MANAGEMENT_REPOSITORIES } from '@/case-management/constants/case-management-repositories'
import { DOCUMENT_PRODUCTION_REPOSITORIES } from '@/document-production/constants/document-production-repositories'
import { CurrentCollaborator } from '@/identity/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'

type RequestBody = { decision: 'approved' | 'rejected'; rejectionReason?: string }

@CasesController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class ReviewCaseDocumentVersionController {
  private readonly useCase: ReviewCaseDocumentVersionUseCase

  constructor(
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.versions)
    versionsRepository: DocumentVersionsRepository,
    @Inject(CASE_MANAGEMENT_REPOSITORIES.legalCases)
    legalCasesRepository: LegalCasesRepository,
    @Inject(CASE_MANAGEMENT_REPOSITORIES.caseMembers)
    caseMembersRepository: CaseMembersRepository,
    datetimeProvider: DatetimeProvider,
  ) {
    this.useCase = new ReviewCaseDocumentVersionUseCaseClass(
      versionsRepository,
      legalCasesRepository,
      caseMembersRepository,
    )
    this.datetimeProvider = datetimeProvider
  }

  private readonly datetimeProvider: DatetimeProvider

  @Patch(':caseId/documents/:documentId/versions/:versionId/review')
  @ApiResponse({ status: HttpStatus.OK })
  @ApiResponse({ status: HttpStatus.FORBIDDEN })
  handle(
    @Param('caseId', new ParseUUIDPipe()) caseId: string,
    @Param('documentId', new ParseUUIDPipe()) documentId: string,
    @Param('versionId', new ParseUUIDPipe()) documentVersionId: string,
    @Body(new ZodValidationPipe(reviewDocumentVersionSchema)) body: RequestBody,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    return this.useCase.execute({
      caseId,
      documentId,
      documentVersionId,
      reviewedByCollaboratorId: collaborator.collaboratorId,
      reviewedByCollaboratorProfile: collaborator.profile,
      decision: body.decision,
      rejectionReason: body.rejectionReason,
      reviewedAt: this.datetimeProvider.now(),
    })
  }
}
