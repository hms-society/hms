import {
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import type {
  CaseChecklistItemsRepository,
  LegalCasesRepository,
} from '@hms/core/case-management/interfaces'
import { HomologateCaseDossierUseCase } from '@hms/core/case-management/use-cases'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'

import { CASE_MANAGEMENT_REPOSITORIES } from '@/case-management/constants/case-management-repositories'
import { CasesController } from '@/case-management/decorators'
import { LegalCaseResponseDto } from '@/case-management/rest/dtos'
import { CurrentCollaborator } from '@/identity/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { ErrorResponseDto } from '@/shared/rest/dtos'

@CasesController()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class HomologateCaseDossierController {
  private readonly useCase: HomologateCaseDossierUseCase

  constructor(
    @Inject(CASE_MANAGEMENT_REPOSITORIES.legalCases)
    legalCasesRepository: LegalCasesRepository,
    @Inject(CASE_MANAGEMENT_REPOSITORIES.caseChecklistItems)
    checklistItemsRepository: CaseChecklistItemsRepository,
  ) {
    this.useCase = new HomologateCaseDossierUseCase(
      legalCasesRepository,
      checklistItemsRepository,
    )
  }

  @Patch(':caseId/dossier-gate/homologation')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The case dossier was homologated successfully.',
    type: LegalCaseResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'The dossier is not ready for homologation.',
    type: ErrorResponseDto,
  })
  handle(
    @Param('caseId', new ParseUUIDPipe()) caseId: string,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    return this.useCase.execute({
      caseId,
      homologatedBy: collaborator.collaboratorId,
    })
  }
}
