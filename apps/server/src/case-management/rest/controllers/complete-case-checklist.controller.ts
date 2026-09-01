import {
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import type { LegalCasesRepository } from '@hms/core/case-management/interfaces'
import { CompleteCaseChecklistUseCase } from '@hms/core/case-management/use-cases'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'

import { CASE_MANAGEMENT_REPOSITORIES } from '@/case-management/constants/case-management-repositories'
import { CasesController } from '@/case-management/decorators'
import { LegalCaseResponseDto } from '@/case-management/rest/dtos'
import { CurrentCollaborator } from '@/identity/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { ErrorResponseDto } from '@/shared/rest/dtos'

@CasesController()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class CompleteCaseChecklistController {
  private readonly useCase: CompleteCaseChecklistUseCase

  constructor(
    @Inject(CASE_MANAGEMENT_REPOSITORIES.legalCases)
    legalCasesRepository: LegalCasesRepository,
  ) {
    this.useCase = new CompleteCaseChecklistUseCase(legalCasesRepository)
  }

  @Patch(':caseId/checklist-completion')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The case checklist was completed successfully.',
    type: LegalCaseResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'The case id is invalid.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The case was not found.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'The checklist cannot be completed.',
    type: ErrorResponseDto,
  })
  handle(
    @Param('caseId', new ParseUUIDPipe()) caseId: string,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    return this.useCase.execute({
      caseId,
      completedBy: collaborator.collaboratorId,
    })
  }
}
