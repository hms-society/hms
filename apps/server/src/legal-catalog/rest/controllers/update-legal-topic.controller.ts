import { Body, HttpStatus, Inject, Param, Patch, UseGuards } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import type { LegalTopicsRepository } from '@hms/core/legal-catalog/interfaces'
import { UpdateLegalTopicUseCase } from '@hms/core/legal-catalog/use-cases'
import { legalTopicUpdateSchema } from '@hms/validation/legal-catalog'
import { ZodValidationPipe } from 'nestjs-zod'

import { LEGAL_CATALOG_REPOSITORIES } from '@/legal-catalog/constants/legal-catalog-repositories'
import { LegalCatalogController } from '@/legal-catalog/decorators'
import { LegalTopicResponseDto, LegalTopicUpdateDto } from '@/legal-catalog/rest/dtos'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import { ActiveAdminGuard, AuthGuard } from '@/identity/guards'

type RequestBody = Omit<Parameters<UpdateLegalTopicUseCase['execute']>[0], 'legalTopicId'>

@LegalCatalogController()
@UseGuards(AuthGuard, ActiveAdminGuard)
export class UpdateLegalTopicController {
  private readonly useCase: UpdateLegalTopicUseCase

  constructor(
    @Inject(LEGAL_CATALOG_REPOSITORIES.topics)
    legalTopicsRepository: LegalTopicsRepository,
  ) {
    this.useCase = new UpdateLegalTopicUseCase(legalTopicsRepository)
  }

  @Patch('admin/topics/:legalTopicId')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The demand type was updated successfully.',
    type: LegalTopicResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The demand type was not found.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'A demand type with the same name already exists in the area.',
    type: ErrorResponseDto,
  })
  handle(
    @Param('legalTopicId') legalTopicId: string,
    @Body(new ZodValidationPipe(legalTopicUpdateSchema)) body: LegalTopicUpdateDto,
  ) {
    return this.useCase.execute({ legalTopicId, ...(body as RequestBody) })
  }
}
