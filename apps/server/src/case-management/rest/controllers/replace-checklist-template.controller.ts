import { Body, HttpStatus, Inject, Put, UseGuards } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import type {
  ChecklistTemplateItemsRepository,
  ChecklistTemplatesRepository,
} from '@hms/core/case-management/interfaces'
import { ReplaceChecklistTemplateUseCase } from '@hms/core/case-management/use-cases'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import { replaceChecklistTemplateSchema } from '@hms/validation/case-management'
import { createZodDto } from 'nestjs-zod'

import { CASE_MANAGEMENT_REPOSITORIES } from '@/case-management/constants/case-management-repositories'
import { CasesController } from '@/case-management/decorators'
import { ChecklistTemplateResponseDto } from '@/case-management/rest/dtos'
import { CurrentCollaborator } from '@/identity/decorators'
import { ActiveAdminGuard, AuthGuard } from '@/identity/guards'
import { ErrorResponseDto } from '@/shared/rest/dtos'

class ReplaceChecklistTemplateControllerRequestBody extends createZodDto(
  replaceChecklistTemplateSchema,
) {}

@CasesController()
@UseGuards(AuthGuard, ActiveAdminGuard)
export class ReplaceChecklistTemplateController {
  private readonly useCase: ReplaceChecklistTemplateUseCase

  constructor(
    @Inject(CASE_MANAGEMENT_REPOSITORIES.checklistTemplates)
    checklistTemplatesRepository: ChecklistTemplatesRepository,
    @Inject(CASE_MANAGEMENT_REPOSITORIES.checklistTemplateItems)
    checklistTemplateItemsRepository: ChecklistTemplateItemsRepository,
  ) {
    this.useCase = new ReplaceChecklistTemplateUseCase(
      checklistTemplatesRepository,
      checklistTemplateItemsRepository,
    )
  }

  @Put('checklist-templates')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The checklist template was replaced successfully.',
    type: ChecklistTemplateResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'The checklist template payload is invalid.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The checklist template was not found.',
    type: ErrorResponseDto,
  })
  handle(
    @Body() body: ReplaceChecklistTemplateControllerRequestBody,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    return this.useCase.execute({
      ...body,
      updatedBy: collaborator.collaboratorId,
    })
  }
}
