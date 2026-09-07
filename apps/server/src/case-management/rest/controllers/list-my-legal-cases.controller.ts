import { Get, HttpStatus, Inject, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import type { LegalCasesRepository } from '@hms/core/case-management/interfaces'
import { ListMyLegalCasesUseCase } from '@hms/core/case-management/use-cases'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'

import { CASE_MANAGEMENT_REPOSITORIES } from '@/case-management/constants/case-management-repositories'
import { CasesController } from '@/case-management/decorators'
import { CurrentCollaborator } from '@/identity/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { ErrorResponseDto } from '@/shared/rest/dtos'

@CasesController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class ListMyLegalCasesController {
  private readonly useCase: ListMyLegalCasesUseCase

  constructor(
    @Inject(CASE_MANAGEMENT_REPOSITORIES.legalCases)
    legalCasesRepository: LegalCasesRepository,
  ) {
    this.useCase = new ListMyLegalCasesUseCase(legalCasesRepository)
  }

  @Get('my')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The current collaborator case list was returned successfully.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication is required.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'An active collaborator account is required.',
    type: ErrorResponseDto,
  })
  handle(@CurrentCollaborator() collaborator: CollaboratorSummary) {
    return this.useCase.execute({ collaboratorId: collaborator.collaboratorId })
  }
}
