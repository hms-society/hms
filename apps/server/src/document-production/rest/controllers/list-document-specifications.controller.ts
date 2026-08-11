import { Get, HttpStatus, Inject, Query, UseGuards, UsePipes } from '@nestjs/common'
import { ApiBearerAuth, ApiQuery, ApiResponse } from '@nestjs/swagger'
import type { DocumentSpecificationsRepository } from '@hms/core/document-production/interfaces'
import { ListDocumentSpecificationsUseCase } from '@hms/core/document-production/use-cases'
import type { LegalExpertiseCatalogProvider } from '@hms/core/legal-catalog/interfaces'
import { ZodValidationPipe } from 'nestjs-zod'

import { DOCUMENT_PRODUCTION_REPOSITORIES } from '@/document-production/constants/document-production-repositories'
import { DocumentProductionController } from '@/document-production/decorators'
import { AuthGuard, ActiveAdminGuard } from '@/identity/guards'
import { LEGAL_CATALOG_PROVIDERS } from '@/legal-catalog/constants/legal-catalog-providers'
import {
  DocumentSpecificationListQueryDto,
  DocumentSpecificationsPageResponseDto,
} from '@/document-production/rest/dtos'
import { ErrorResponseDto } from '@/shared/rest/dtos'

@DocumentProductionController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveAdminGuard)
export class ListDocumentSpecificationsController {
  private readonly useCase: ListDocumentSpecificationsUseCase

  constructor(
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.specifications)
    specificationsRepository: DocumentSpecificationsRepository,
    @Inject(LEGAL_CATALOG_PROVIDERS.legalExpertiseCatalog)
    legalExpertiseCatalogProvider: LegalExpertiseCatalogProvider,
  ) {
    this.useCase = new ListDocumentSpecificationsUseCase(
      specificationsRepository,
      legalExpertiseCatalogProvider,
    )
  }

  @Get()
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'legalAreaId', required: false, type: String, format: 'uuid' })
  @ApiQuery({ name: 'legalTopicId', required: false, type: String, format: 'uuid' })
  @ApiQuery({ name: 'moment', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    type: Number,
    example: 20,
    maximum: 100,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The document specifications page was returned successfully.',
    type: DocumentSpecificationsPageResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'The query is invalid.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication is required.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'An active administrator is required.',
    type: ErrorResponseDto,
  })
  @UsePipes(ZodValidationPipe)
  handle(@Query() query: DocumentSpecificationListQueryDto) {
    return this.useCase.execute({ query })
  }
}
