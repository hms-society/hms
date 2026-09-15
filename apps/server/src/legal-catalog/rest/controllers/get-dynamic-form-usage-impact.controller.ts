import { Get, HttpStatus, Inject, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import type { DynamicFormUsageProvider } from '@hms/core/legal-catalog/interfaces'
import type { DynamicFormAdministrationRepository } from '@hms/core/legal-catalog/interfaces'
import { GetDynamicFormUsageImpactUseCase } from '@hms/core/legal-catalog/use-cases'

import { LEGAL_CATALOG_PROVIDERS } from '@/legal-catalog/constants/legal-catalog-providers'
import { LEGAL_CATALOG_REPOSITORIES } from '@/legal-catalog/constants/legal-catalog-repositories'
import { LegalCatalogController } from '@/legal-catalog/decorators'
import { DynamicFormUsageImpactResponseDto } from '@/legal-catalog/rest/dtos'
import { ActiveAdminGuard, AuthGuard } from '@/identity/guards'
import { ErrorResponseDto } from '@/shared/rest/dtos'

@LegalCatalogController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveAdminGuard)
export class GetDynamicFormUsageImpactController {
  private readonly useCase: GetDynamicFormUsageImpactUseCase

  constructor(
    @Inject(LEGAL_CATALOG_REPOSITORIES.dynamicForms)
    dynamicFormAdministrationRepository: DynamicFormAdministrationRepository,
    @Inject(LEGAL_CATALOG_PROVIDERS.dynamicFormUsage)
    dynamicFormUsageProvider: DynamicFormUsageProvider,
  ) {
    this.useCase = new GetDynamicFormUsageImpactUseCase(
      dynamicFormAdministrationRepository,
      dynamicFormUsageProvider,
    )
  }

  @Get('dynamic-forms/:dynamicFormId/impact')
  @ApiResponse({ status: HttpStatus.OK, type: DynamicFormUsageImpactResponseDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorResponseDto })
  handle(@Param('dynamicFormId', new ParseUUIDPipe()) dynamicFormId: string) {
    return this.useCase
      .execute({ dynamicFormId })
      .then(DynamicFormUsageImpactResponseDto.fromDomain)
  }
}
