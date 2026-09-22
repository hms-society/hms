import { Body, HttpStatus, Inject, Param, ParseUUIDPipe, Post } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import type { LegalCasesRepository, CasePortalAccessGrantsRepository } from '@hms/core/case-management/interfaces'
import { GrantCasePortalAccessUseCase } from '@hms/core/case-management/use-cases'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'

import { CASE_MANAGEMENT_REPOSITORIES } from '@/case-management/constants/case-management-repositories'
import { CasesController } from '@/case-management/decorators'
import { CurrentCollaborator } from '@/identity/decorators'
import { ErrorResponseDto } from '@/shared/rest/dtos'

type RequestBody = { userId: string; canUpload: boolean; expiresAt?: string }

@CasesController()
export class GrantCasePortalAccessController {
  private readonly useCase: GrantCasePortalAccessUseCase

  constructor(
    @Inject(CASE_MANAGEMENT_REPOSITORIES.legalCases) legalCasesRepository: LegalCasesRepository,
    @Inject(CASE_MANAGEMENT_REPOSITORIES.casePortalAccessGrants)
    grantsRepository: CasePortalAccessGrantsRepository,
  ) {
    this.useCase = new GrantCasePortalAccessUseCase(legalCasesRepository, grantsRepository)
  }

  @Post(':caseId/portal-access')
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Case portal access granted.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorResponseDto })
  handle(
    @Param('caseId', new ParseUUIDPipe()) caseId: string,
    @Body() body: RequestBody,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    return this.useCase.execute({
      caseId,
      collaboratorId: collaborator.collaboratorId,
      userId: body.userId,
      canUpload: body.canUpload,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
    })
  }
}
