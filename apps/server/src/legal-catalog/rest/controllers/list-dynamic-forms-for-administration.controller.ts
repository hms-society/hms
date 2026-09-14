import { Get, HttpStatus, Inject, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import type { DynamicFormListQuery } from '@hms/core/legal-catalog/domain/structures'
import type { DynamicFormAdministrationRepository } from '@hms/core/legal-catalog/interfaces'
import { ListDynamicFormsForAdministrationUseCase } from '@hms/core/legal-catalog/use-cases'
import { dynamicFormAdministrationSearchSchema } from '@hms/validation/legal-catalog'
import { ZodValidationPipe } from 'nestjs-zod'

import { LEGAL_CATALOG_REPOSITORIES } from '@/legal-catalog/constants/legal-catalog-repositories'
import { LegalCatalogController } from '@/legal-catalog/decorators'
import { DynamicFormListResponseDto } from '@/legal-catalog/rest/dtos'
import { ActiveAdminGuard, AuthGuard } from '@/identity/guards'
import { ErrorResponseDto } from '@/shared/rest/dtos'

@LegalCatalogController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveAdminGuard)
export class ListDynamicFormsForAdministrationController {
  private readonly useCase: ListDynamicFormsForAdministrationUseCase

  constructor(
    @Inject(LEGAL_CATALOG_REPOSITORIES.dynamicForms)
    dynamicFormAdministrationRepository: DynamicFormAdministrationRepository,
  ) {
    this.useCase = new ListDynamicFormsForAdministrationUseCase(
      dynamicFormAdministrationRepository,
    )
  }

  @Get('dynamic-forms')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dynamic forms were returned successfully.',
    type: DynamicFormListResponseDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, type: ErrorResponseDto })
  handle(
    @Query(new ZodValidationPipe(dynamicFormAdministrationSearchSchema))
    query: DynamicFormListQuery,
  ) {
    return this.useCase.execute(query).then(DynamicFormListResponseDto.fromDomain)
  }
}
