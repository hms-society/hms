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
import type { DocumentSpecificationsRepository } from '@hms/core/document-production/interfaces'
import { UpdateDocumentSpecificationTemplateUseCase } from '@hms/core/document-production/use-cases'
import { documentSpecificationTemplateUpdateSchema } from '@hms/validation/document-production'
import { ZodValidationPipe } from 'nestjs-zod'

import { DOCUMENT_PRODUCTION_REPOSITORIES } from '@/document-production/constants/document-production-repositories'
import { DocumentProductionController } from '@/document-production/decorators'
import {
  DocumentSpecificationResponseDto,
  UpdateDocumentSpecificationTemplateRequestDto,
} from '@/document-production/rest/dtos'
import { ActiveAdminGuard, AuthGuard } from '@/identity/guards'
import { ErrorResponseDto } from '@/shared/rest/dtos'

type ExecuteRequest = Parameters<UpdateDocumentSpecificationTemplateUseCase['execute']>[0]
type RequestBody = ExecuteRequest['changes']

@DocumentProductionController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveAdminGuard)
export class UpdateDocumentSpecificationTemplateController {
  private readonly useCase: UpdateDocumentSpecificationTemplateUseCase

  constructor(
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.specifications)
    specificationsRepository: DocumentSpecificationsRepository,
  ) {
    this.useCase = new UpdateDocumentSpecificationTemplateUseCase(
      specificationsRepository,
    )
  }

  @Patch(':documentSpecificationId/template')
  @ApiBody({ type: UpdateDocumentSpecificationTemplateRequestDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The document specification template was updated successfully.',
    type: DocumentSpecificationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'The document specification template is invalid.',
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
    @Body(new ZodValidationPipe(documentSpecificationTemplateUpdateSchema))
    body: RequestBody,
  ): Promise<DocumentSpecificationResponseDto> {
    return this.useCase
      .execute({ documentSpecificationId, changes: body })
      .then(DocumentSpecificationResponseDto.fromDomain)
  }
}
