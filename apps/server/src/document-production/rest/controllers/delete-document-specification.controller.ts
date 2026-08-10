import {
  Delete,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import type { DocumentSpecificationsRepository } from '@hms/core/document-production/interfaces'
import { DeleteDocumentSpecificationUseCase } from '@hms/core/document-production/use-cases'

import { DOCUMENT_PRODUCTION_REPOSITORIES } from '@/document-production/constants/document-production-repositories'
import { DocumentProductionController } from '@/document-production/decorators'
import { ActiveAdminGuard, AuthGuard } from '@/identity/guards'
import { ErrorResponseDto } from '@/shared/rest/dtos'

type Request = Parameters<DeleteDocumentSpecificationUseCase['execute']>[0]

@DocumentProductionController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveAdminGuard)
export class DeleteDocumentSpecificationController {
  private readonly useCase: DeleteDocumentSpecificationUseCase

  constructor(
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.specifications)
    specificationsRepository: DocumentSpecificationsRepository,
  ) {
    this.useCase = new DeleteDocumentSpecificationUseCase(specificationsRepository)
  }

  @Delete(':documentSpecificationId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'The document specification was deleted successfully.',
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
  ): Promise<void> {
    return this.useCase.execute({ documentSpecificationId })
  }
}
