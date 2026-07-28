import { Get, HttpStatus, Inject, UseGuards } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import type { LegalAreasRepository } from '@hms/core/legal-catalog/interfaces'
import { ListLegalAreasUseCase } from '@hms/core/legal-catalog/use-cases'

import { LEGAL_CATALOG_REPOSITORIES } from '@/legal-catalog/constants/legal-catalog-repositories'
import { LegalCatalogController } from '@/legal-catalog/decorators'
import { LegalAreaResponseDto } from '@/legal-catalog/rest/dtos'
import { AuthGuard } from '@/identity/guards'

@LegalCatalogController()
@UseGuards(AuthGuard)
export class ListLegalAreasController {
  private readonly useCase: ListLegalAreasUseCase

  constructor(
    @Inject(LEGAL_CATALOG_REPOSITORIES.areas)
    legalAreasRepository: LegalAreasRepository,
  ) {
    this.useCase = new ListLegalAreasUseCase(legalAreasRepository)
  }

  @Get('areas')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The active legal areas were returned successfully.',
    type: [LegalAreaResponseDto],
  })
  handle() {
    return this.useCase.execute()
  }
}
