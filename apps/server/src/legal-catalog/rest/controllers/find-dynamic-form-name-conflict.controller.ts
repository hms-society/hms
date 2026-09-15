import { Get, HttpStatus, Inject, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import { FindDynamicFormNameConflictUseCase as FindNameConflictUseCase } from '@hms/core/legal-catalog/use-cases'
import type { DynamicFormAdministrationRepository } from '@hms/core/legal-catalog/interfaces'
import { dynamicFormNameConflictSearchSchema } from '@hms/validation/legal-catalog'
import { ZodValidationPipe } from 'nestjs-zod'

import { LEGAL_CATALOG_REPOSITORIES } from '@/legal-catalog/constants/legal-catalog-repositories'
import { LegalCatalogController } from '@/legal-catalog/decorators'
import { DynamicFormNameConflictResponseDto } from '@/legal-catalog/rest/dtos'
import { ActiveAdminGuard, AuthGuard } from '@/identity/guards'
import { ErrorResponseDto } from '@/shared/rest/dtos'

type Request = Parameters<FindNameConflictUseCase['execute']>[0]

@LegalCatalogController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveAdminGuard)
export class FindDynamicFormNameConflictController {
  private readonly useCase: FindNameConflictUseCase

  constructor(
    @Inject(LEGAL_CATALOG_REPOSITORIES.dynamicForms)
    dynamicFormAdministrationRepository: DynamicFormAdministrationRepository,
  ) {
    this.useCase = new FindNameConflictUseCase(dynamicFormAdministrationRepository)
  }

  @Get('dynamic-form-name-conflicts')
  @ApiResponse({ status: HttpStatus.OK, type: DynamicFormNameConflictResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, type: ErrorResponseDto })
  handle(
    @Query(new ZodValidationPipe(dynamicFormNameConflictSearchSchema)) query: Request,
  ) {
    return this.useCase.execute(query)
  }
}
