import { Body, HttpStatus, Inject, Post, UseGuards } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import type {
  LegalAreasRepository,
  LegalTopicsRepository,
} from '@hms/core/legal-catalog/interfaces'
import { CreateLegalTopicUseCase } from '@hms/core/legal-catalog/use-cases'
import { legalTopicInputSchema } from '@hms/validation/legal-catalog'
import { ZodValidationPipe } from 'nestjs-zod'

import { LEGAL_CATALOG_REPOSITORIES } from '@/legal-catalog/constants/legal-catalog-repositories'
import { LegalCatalogController } from '@/legal-catalog/decorators'
import { LegalTopicInputDto, LegalTopicResponseDto } from '@/legal-catalog/rest/dtos'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import { ActiveAdminGuard, AuthGuard } from '@/identity/guards'

type RequestBody = Parameters<CreateLegalTopicUseCase['execute']>[0]

@LegalCatalogController()
@UseGuards(AuthGuard, ActiveAdminGuard)
export class CreateLegalTopicController {
  private readonly useCase: CreateLegalTopicUseCase

  constructor(
    @Inject(LEGAL_CATALOG_REPOSITORIES.areas)
    legalAreasRepository: LegalAreasRepository,
    @Inject(LEGAL_CATALOG_REPOSITORIES.topics)
    legalTopicsRepository: LegalTopicsRepository,
  ) {
    this.useCase = new CreateLegalTopicUseCase(
      legalAreasRepository,
      legalTopicsRepository,
    )
  }

  @Post('admin/topics')
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The demand type was created successfully.',
    type: LegalTopicResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The legal area was not found.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'A demand type with the same name already exists in the area.',
    type: ErrorResponseDto,
  })
  handle(@Body(new ZodValidationPipe(legalTopicInputSchema)) body: LegalTopicInputDto) {
    return this.useCase.execute(body as RequestBody)
  }
}
