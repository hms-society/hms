import {
  Body,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import type {
  CaseAccessProvider,
  CaseChecklistItemsRepository,
} from '@hms/core/case-management/interfaces'
import { AddCaseChecklistComplementaryItemUseCase } from '@hms/core/case-management/use-cases'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'

import { CASE_MANAGEMENT_REPOSITORIES } from '@/case-management/constants/case-management-repositories'
import { CASE_MANAGEMENT_ACCESS } from '@/case-management/constants/case-management-access'
import { CasesController } from '@/case-management/decorators'
import { CaseChecklistItemResponseDto } from '@/case-management/rest/dtos'
import { CurrentCollaborator } from '@/identity/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { ErrorResponseDto } from '@/shared/rest/dtos'

type RequestBody = Omit<
  Parameters<AddCaseChecklistComplementaryItemUseCase['execute']>[0],
  'caseId' | 'collaboratorId'
>

@CasesController()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class AddCaseChecklistComplementaryItemController {
  private readonly useCase: AddCaseChecklistComplementaryItemUseCase

  constructor(
    @Inject(CASE_MANAGEMENT_REPOSITORIES.caseChecklistItems)
    caseChecklistItemsRepository: CaseChecklistItemsRepository,
    @Inject(CASE_MANAGEMENT_ACCESS.access) accessProvider: CaseAccessProvider,
  ) {
    this.useCase = new AddCaseChecklistComplementaryItemUseCase(
      caseChecklistItemsRepository,
      accessProvider,
    )
  }

  @Post(':caseId/checklist/items')
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The complementary checklist item was added successfully.',
    type: CaseChecklistItemResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'The case id is invalid.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The case was not found for this collaborator.',
    type: ErrorResponseDto,
  })
  handle(
    @Param('caseId', new ParseUUIDPipe()) caseId: string,
    @Body() body: RequestBody,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    return this.useCase.execute({
      caseId,
      collaboratorId: collaborator.collaboratorId,
      ...body,
    })
  }
}
