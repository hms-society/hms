import {
  Body,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
  UsePipes,
} from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import type { LegalCasesRepository } from '@hms/core/case-management/interfaces'
import { ReviewCaseChecklistGateUseCase } from '@hms/core/case-management/use-cases'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import { reviewCaseChecklistGateSchema } from '@hms/validation/case-management'
import { createZodDto, ZodValidationPipe } from 'nestjs-zod'

import { CASE_MANAGEMENT_REPOSITORIES } from '@/case-management/constants/case-management-repositories'
import { CasesController } from '@/case-management/decorators'
import { LegalCaseResponseDto } from '@/case-management/rest/dtos'
import { CurrentCollaborator } from '@/identity/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { ErrorResponseDto } from '@/shared/rest/dtos'

class ReviewCaseChecklistGateControllerRequestBody extends createZodDto(
  reviewCaseChecklistGateSchema,
) {}

@CasesController()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class ReviewCaseChecklistGateController {
  private readonly useCase: ReviewCaseChecklistGateUseCase

  constructor(
    @Inject(CASE_MANAGEMENT_REPOSITORIES.legalCases)
    legalCasesRepository: LegalCasesRepository,
  ) {
    this.useCase = new ReviewCaseChecklistGateUseCase(legalCasesRepository)
  }

  @Patch(':caseId/checklist-gate')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The case checklist gate was reviewed successfully.',
    type: LegalCaseResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'The checklist gate review data are invalid.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The case was not found.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'The checklist gate review is invalid.',
    type: ErrorResponseDto,
  })
  @UsePipes(ZodValidationPipe)
  handle(
    @Param('caseId', new ParseUUIDPipe()) caseId: string,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
    @Body() body: ReviewCaseChecklistGateControllerRequestBody,
  ) {
    return this.useCase.execute({
      caseId,
      ...body,
      decidedBy: collaborator.collaboratorId,
    })
  }
}
