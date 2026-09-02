import { Get, HttpStatus, Inject, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import type {
  CaseChecklistItemsRepository,
  LegalCasesRepository,
} from '@hms/core/case-management/interfaces'
import { ListCaseChecklistUseCase } from '@hms/core/case-management/use-cases'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'

import { CASE_MANAGEMENT_REPOSITORIES } from '@/case-management/constants/case-management-repositories'
import { CasesController } from '@/case-management/decorators'
import { CaseChecklistItemResponseDto } from '@/case-management/rest/dtos'
import { CurrentCollaborator } from '@/identity/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { ErrorResponseDto } from '@/shared/rest/dtos'

@CasesController()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class ListCaseChecklistController {
  private readonly useCase: ListCaseChecklistUseCase

  constructor(
    @Inject(CASE_MANAGEMENT_REPOSITORIES.legalCases)
    legalCasesRepository: LegalCasesRepository,
    @Inject(CASE_MANAGEMENT_REPOSITORIES.caseChecklistItems)
    caseChecklistItemsRepository: CaseChecklistItemsRepository,
  ) {
    this.useCase = new ListCaseChecklistUseCase(
      legalCasesRepository,
      caseChecklistItemsRepository,
    )
  }

  @Get(':caseId/checklist')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The case checklist was returned successfully.',
    type: [CaseChecklistItemResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'The case id is invalid.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The case checklist was not found for this collaborator.',
    type: ErrorResponseDto,
  })
  handle(
    @Param('caseId', new ParseUUIDPipe()) caseId: string,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    return this.useCase.execute({
      caseId,
      collaboratorId: collaborator.collaboratorId,
    })
  }
}
