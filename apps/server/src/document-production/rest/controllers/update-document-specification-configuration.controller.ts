import {
  Body,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiResponse } from '@nestjs/swagger'
import type { DocumentSpecificationMutationRepository } from '@hms/core/document-production/interfaces'
import { UpdateDocumentSpecificationConfigurationUseCase } from '@hms/core/document-production/use-cases'
import type { LegalExpertiseCatalogProvider } from '@hms/core/legal-catalog/interfaces'
import { documentSpecificationConfigurationUpdateSchema } from '@hms/validation/document-production'
import { ZodValidationPipe } from 'nestjs-zod'

import { DOCUMENT_PRODUCTION_REPOSITORIES } from '@/document-production/constants/document-production-repositories'
import { DocumentProductionController } from '@/document-production/decorators'
import {
  DocumentSpecificationResponseDto,
  UpdateDocumentSpecificationConfigurationRequestDto,
} from '@/document-production/rest/dtos'
import { ActiveAdminGuard, AuthGuard } from '@/identity/guards'
import { LEGAL_CATALOG_PROVIDERS } from '@/legal-catalog/constants/legal-catalog-providers'
import { ErrorResponseDto } from '@/shared/rest/dtos'

type ExecuteRequest = Parameters<
  UpdateDocumentSpecificationConfigurationUseCase['execute']
>[0]
type RequestBody = ExecuteRequest['changes']

@DocumentProductionController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveAdminGuard)
export class UpdateDocumentSpecificationConfigurationController {
  private readonly useCase: UpdateDocumentSpecificationConfigurationUseCase

  constructor(
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.specifications)
    specificationsRepository: DocumentSpecificationMutationRepository,
    @Inject(LEGAL_CATALOG_PROVIDERS.legalExpertiseCatalog)
    legalExpertiseCatalogProvider: LegalExpertiseCatalogProvider,
  ) {
    this.useCase = new UpdateDocumentSpecificationConfigurationUseCase(
      specificationsRepository,
      legalExpertiseCatalogProvider,
    )
  }

  @Patch(':documentSpecificationId/configuration')
  @ApiBody({ type: UpdateDocumentSpecificationConfigurationRequestDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The document specification configuration was updated successfully.',
    type: DocumentSpecificationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'The document specification configuration is invalid.',
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
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The document specification was not found.',
    type: ErrorResponseDto,
  })
  handle(
    @Param('documentSpecificationId', new ParseUUIDPipe())
    documentSpecificationId: string,
    @Body(new ZodValidationPipe(documentSpecificationConfigurationUpdateSchema))
    body: RequestBody,
  ): Promise<DocumentSpecificationResponseDto> {
    return this.useCase
      .execute({ documentSpecificationId, changes: body })
      .then(DocumentSpecificationResponseDto.fromDomain)
  }
}
