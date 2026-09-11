import { Get, HttpStatus, Inject, UseGuards } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import type {
  ChecklistTemplateItemsRepository,
  ChecklistTemplatesRepository,
} from '@hms/core/case-management/interfaces'
import { ListChecklistTemplatesUseCase } from '@hms/core/case-management/use-cases'

import { CASE_MANAGEMENT_REPOSITORIES } from '@/case-management/constants/case-management-repositories'
import { CasesController } from '@/case-management/decorators'
import { ChecklistTemplateResponseDto } from '@/case-management/rest/dtos'
import { ActiveAdminGuard, AuthGuard } from '@/identity/guards'
import { ErrorResponseDto } from '@/shared/rest/dtos'

@CasesController()
@UseGuards(AuthGuard, ActiveAdminGuard)
export class ListChecklistTemplatesController {
  private readonly useCase: ListChecklistTemplatesUseCase

  constructor(
    @Inject(CASE_MANAGEMENT_REPOSITORIES.checklistTemplates)
    checklistTemplatesRepository: ChecklistTemplatesRepository,
    @Inject(CASE_MANAGEMENT_REPOSITORIES.checklistTemplateItems)
    checklistTemplateItemsRepository: ChecklistTemplateItemsRepository,
  ) {
    this.useCase = new ListChecklistTemplatesUseCase(
      checklistTemplatesRepository,
      checklistTemplateItemsRepository,
    )
  }

  @Get('checklist-templates')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The checklist templates were returned successfully.',
    type: [ChecklistTemplateResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'The request is not authenticated.',
    type: ErrorResponseDto,
  })
  handle() {
    return this.useCase.execute()
  }
}
