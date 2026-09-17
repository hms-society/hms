import { Get, HttpStatus, Inject, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import type {
  DynamicFormAdministrationRepository,
  LegalAreasRepository,
  LegalTopicsRepository,
} from '@hms/core/legal-catalog/interfaces'
import { GetDynamicFormForAdministrationUseCase } from '@hms/core/legal-catalog/use-cases'

import { LEGAL_CATALOG_REPOSITORIES } from '@/legal-catalog/constants/legal-catalog-repositories'
import { LegalCatalogController } from '@/legal-catalog/decorators'
import { DynamicFormEditorDetailsResponseDto } from '@/legal-catalog/rest/dtos'
import { ActiveAdminGuard, AuthGuard } from '@/identity/guards'
import { ErrorResponseDto } from '@/shared/rest/dtos'

@LegalCatalogController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveAdminGuard)
export class GetDynamicFormForAdministrationController {
  private readonly useCase: GetDynamicFormForAdministrationUseCase

  constructor(
    @Inject(LEGAL_CATALOG_REPOSITORIES.dynamicForms)
    dynamicFormAdministrationRepository: DynamicFormAdministrationRepository,
    @Inject(LEGAL_CATALOG_REPOSITORIES.areas)
    legalAreasRepository: LegalAreasRepository,
    @Inject(LEGAL_CATALOG_REPOSITORIES.topics)
    legalTopicsRepository: LegalTopicsRepository,
  ) {
    this.useCase = new GetDynamicFormForAdministrationUseCase(
      dynamicFormAdministrationRepository,
      legalAreasRepository,
      legalTopicsRepository,
    )
  }

  @Get('dynamic-forms/:dynamicFormId')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The dynamic form editor details were returned successfully.',
    type: DynamicFormEditorDetailsResponseDto,
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorResponseDto })
  handle(@Param('dynamicFormId', new ParseUUIDPipe()) dynamicFormId: string) {
    return this.useCase
      .execute({ dynamicFormId })
      .then(DynamicFormEditorDetailsResponseDto.fromDomain)
  }
}
