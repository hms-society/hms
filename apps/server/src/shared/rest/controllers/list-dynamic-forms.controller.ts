import { Controller, Get, HttpStatus, Inject, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiQuery, ApiResponse } from '@nestjs/swagger'
import type { DynamicFormListQuery } from '@hms/core/shared/domain'
import type { DynamicFormsRepository } from '@hms/core/shared/interfaces'
import { ListDynamicFormsUseCase } from '@hms/core/shared/use-cases'

import { DYNAMIC_FORMS_REPOSITORIES } from '@/shared/constants/dynamic-forms-repositories'
import { AuthGuard } from '@/identity/guards'
import { DynamicFormResponseDto } from '@/shared/rest/dtos'

@Controller('dynamic-forms')
@ApiBearerAuth()
@UseGuards(AuthGuard)
export class ListDynamicFormsController {
  private readonly useCase: ListDynamicFormsUseCase

  constructor(
    @Inject(DYNAMIC_FORMS_REPOSITORIES.dynamicForms)
    dynamicFormsRepository: DynamicFormsRepository,
  ) {
    this.useCase = new ListDynamicFormsUseCase(dynamicFormsRepository)
  }

  @Get()
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'legalAreaId', required: false, type: String, format: 'uuid' })
  @ApiQuery({ name: 'legalTopicId', required: false, type: String, format: 'uuid' })
  @ApiQuery({ name: 'contextType', required: false, type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Available dynamic forms were returned successfully.',
    type: [DynamicFormResponseDto],
  })
  handle(@Query() query: DynamicFormListQuery) {
    return this.useCase
      .execute({ query })
      .then((forms) => forms.map(DynamicFormResponseDto.fromDomain))
  }
}
