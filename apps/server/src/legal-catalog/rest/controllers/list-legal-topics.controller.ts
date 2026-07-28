import { Get, HttpStatus, Inject, Param, UseGuards } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import type { LegalTopicsRepository } from '@hms/core/legal-catalog/interfaces'
import { ListLegalTopicsUseCase } from '@hms/core/legal-catalog/use-cases'

import { LEGAL_CATALOG_REPOSITORIES } from '@/legal-catalog/constants/legal-catalog-repositories'
import { LegalCatalogController } from '@/legal-catalog/decorators'
import { LegalTopicResponseDto } from '@/legal-catalog/rest/dtos'
import { AuthGuard } from '@/identity/guards'

@LegalCatalogController()
@UseGuards(AuthGuard)
export class ListLegalTopicsController {
  private readonly useCase: ListLegalTopicsUseCase

  constructor(
    @Inject(LEGAL_CATALOG_REPOSITORIES.topics)
    legalTopicsRepository: LegalTopicsRepository,
  ) {
    this.useCase = new ListLegalTopicsUseCase(legalTopicsRepository)
  }

  @Get('areas/:legalAreaId/topics')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The active legal topics were returned successfully.',
    type: [LegalTopicResponseDto],
  })
  handle(@Param('legalAreaId') legalAreaId: string) {
    return this.useCase.execute({ legalAreaId })
  }
}
