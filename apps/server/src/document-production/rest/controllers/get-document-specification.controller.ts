import { Get, HttpStatus, Inject, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import type { DocumentSpecificationMutationRepository } from '@hms/core/document-production/interfaces'
import { GetDocumentSpecificationUseCase } from '@hms/core/document-production/use-cases'

import { DOCUMENT_PRODUCTION_REPOSITORIES } from '@/document-production/constants/document-production-repositories'
import { DocumentProductionController } from '@/document-production/decorators'
import { DocumentSpecificationResponseDto } from '@/document-production/rest/dtos'
import { ActiveAdminGuard, AuthGuard } from '@/identity/guards'
import { ErrorResponseDto } from '@/shared/rest/dtos'

type Request = Parameters<GetDocumentSpecificationUseCase['execute']>[0]

@DocumentProductionController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveAdminGuard)
export class GetDocumentSpecificationController {
  private readonly useCase: GetDocumentSpecificationUseCase

  constructor(
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.specifications)
    specificationsRepository: DocumentSpecificationMutationRepository,
  ) {
    this.useCase = new GetDocumentSpecificationUseCase(specificationsRepository)
  }

  @Get(':documentSpecificationId')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The document specification was returned successfully.',
    type: DocumentSpecificationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'The document specification identifier is invalid.',
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
    documentSpecificationId: Request['documentSpecificationId'],
  ): Promise<DocumentSpecificationResponseDto> {
    return this.useCase
      .execute({ documentSpecificationId })
      .then(DocumentSpecificationResponseDto.fromDomain)
  }
}
