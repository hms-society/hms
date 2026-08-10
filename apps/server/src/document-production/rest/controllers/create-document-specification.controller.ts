import { Body, HttpStatus, Inject, Post, UseGuards, UsePipes } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiResponse } from '@nestjs/swagger'
import type { DocumentSpecificationsRepository } from '@hms/core/document-production/interfaces'
import { CreateDocumentSpecificationUseCase } from '@hms/core/document-production/use-cases'
import type { LegalExpertiseCatalogProvider } from '@hms/core/legal-catalog/interfaces'
import { createDocumentSpecificationSchema } from '@hms/validation/document-production'
import { ZodValidationPipe } from 'nestjs-zod'

import { DOCUMENT_PRODUCTION_REPOSITORIES } from '@/document-production/constants/document-production-repositories'
import { DocumentProductionController } from '@/document-production/decorators'
import {
  CreateDocumentSpecificationRequestDto,
  DocumentSpecificationResponseDto,
} from '@/document-production/rest/dtos'
import { LEGAL_CATALOG_PROVIDERS } from '@/legal-catalog/constants/legal-catalog-providers'
import { ActiveAdminGuard, AuthGuard } from '@/identity/guards'
import { ErrorResponseDto } from '@/shared/rest/dtos'

type RequestBody = Parameters<CreateDocumentSpecificationUseCase['execute']>[0]

@DocumentProductionController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveAdminGuard)
export class CreateDocumentSpecificationController {
  private readonly useCase: CreateDocumentSpecificationUseCase

  constructor(
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.specifications)
    specificationsRepository: DocumentSpecificationsRepository,
    @Inject(LEGAL_CATALOG_PROVIDERS.legalExpertiseCatalog)
    legalExpertiseCatalogProvider: LegalExpertiseCatalogProvider,
  ) {
    this.useCase = new CreateDocumentSpecificationUseCase(
      specificationsRepository,
      legalExpertiseCatalogProvider,
    )
  }

  @Post()
  @ApiBody({ type: CreateDocumentSpecificationRequestDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The document specification was created successfully.',
    type: DocumentSpecificationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'The document specification data are invalid.',
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
  @UsePipes(new ZodValidationPipe(createDocumentSpecificationSchema))
  handle(@Body() body: RequestBody): Promise<DocumentSpecificationResponseDto> {
    return this.useCase.execute(body).then(DocumentSpecificationResponseDto.fromDomain)
  }
}
