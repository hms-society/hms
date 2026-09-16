import { Get, HttpStatus, Inject, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import type { DynamicFormAdministrationRepository } from '@hms/core/legal-catalog/interfaces'
import type { DynamicFormUsageProvider } from '@hms/core/legal-catalog/interfaces'
import { GetDynamicFormFieldUsageImpactUseCase } from '@hms/core/legal-catalog/use-cases'

import { LEGAL_CATALOG_PROVIDERS } from '@/legal-catalog/constants/legal-catalog-providers'
import { LEGAL_CATALOG_REPOSITORIES } from '@/legal-catalog/constants/legal-catalog-repositories'
import { LegalCatalogController } from '@/legal-catalog/decorators'
import { DynamicFormFieldUsageImpactResponseDto } from '@/legal-catalog/rest/dtos'
import { ActiveAdminGuard, AuthGuard } from '@/identity/guards'
import { ErrorResponseDto } from '@/shared/rest/dtos'

@LegalCatalogController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveAdminGuard)
export class GetDynamicFormFieldUsageImpactController {
  private readonly useCase: GetDynamicFormFieldUsageImpactUseCase

  constructor(
    @Inject(LEGAL_CATALOG_REPOSITORIES.dynamicForms)
    administrationRepository: DynamicFormAdministrationRepository,
    @Inject(LEGAL_CATALOG_PROVIDERS.dynamicFormUsage)
    usageProvider: DynamicFormUsageProvider,
  ) {
    this.useCase = new GetDynamicFormFieldUsageImpactUseCase(
      administrationRepository,
      usageProvider,
    )
  }

  @Get('dynamic-forms/:dynamicFormId/fields/:fieldId/impact')
  @ApiResponse({ status: HttpStatus.OK, type: DynamicFormFieldUsageImpactResponseDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorResponseDto })
  handle(
    @Param('dynamicFormId', new ParseUUIDPipe()) dynamicFormId: string,
    @Param('fieldId', new ParseUUIDPipe()) fieldId: string,
  ) {
    return this.useCase
      .execute({ dynamicFormId, fieldId })
      .then(DynamicFormFieldUsageImpactResponseDto.fromDomain)
  }
}
