import { Get, HttpStatus, Inject, UseGuards } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import type {
  LegalAreasRepository,
  LegalTopicsRepository,
} from '@hms/core/legal-catalog/interfaces'
import { ListAdminLegalAreasUseCase } from '@hms/core/legal-catalog/use-cases'

import { LEGAL_CATALOG_REPOSITORIES } from '@/legal-catalog/constants/legal-catalog-repositories'
import { LegalCatalogController } from '@/legal-catalog/decorators'
import { LegalAreaWithTopicsResponseDto } from '@/legal-catalog/rest/dtos'
import { ActiveAdminGuard, AuthGuard } from '@/identity/guards'

@LegalCatalogController()
@UseGuards(AuthGuard, ActiveAdminGuard)
export class ListAdminLegalAreasController {
  private readonly useCase: ListAdminLegalAreasUseCase

  constructor(
    @Inject(LEGAL_CATALOG_REPOSITORIES.areas)
    legalAreasRepository: LegalAreasRepository,
    @Inject(LEGAL_CATALOG_REPOSITORIES.topics)
    legalTopicsRepository: LegalTopicsRepository,
  ) {
    this.useCase = new ListAdminLegalAreasUseCase(
      legalAreasRepository,
      legalTopicsRepository,
    )
  }

  @Get('admin/areas')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The legal areas and demand types were returned successfully.',
    type: [LegalAreaWithTopicsResponseDto],
  })
  handle() {
    return this.useCase.execute()
  }
}
