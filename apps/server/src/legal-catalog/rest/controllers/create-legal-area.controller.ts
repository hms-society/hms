import { Body, HttpStatus, Inject, Post, UseGuards } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import type { LegalAreasRepository } from '@hms/core/legal-catalog/interfaces'
import { CreateLegalAreaUseCase } from '@hms/core/legal-catalog/use-cases'
import { legalAreaInputSchema } from '@hms/validation/legal-catalog'
import { ZodValidationPipe } from 'nestjs-zod'

import { LEGAL_CATALOG_REPOSITORIES } from '@/legal-catalog/constants/legal-catalog-repositories'
import { LegalCatalogController } from '@/legal-catalog/decorators'
import { LegalAreaInputDto, LegalAreaResponseDto } from '@/legal-catalog/rest/dtos'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import { ActiveAdminGuard, AuthGuard } from '@/identity/guards'

type RequestBody = Parameters<CreateLegalAreaUseCase['execute']>[0]

@LegalCatalogController()
@UseGuards(AuthGuard, ActiveAdminGuard)
export class CreateLegalAreaController {
  private readonly useCase: CreateLegalAreaUseCase

  constructor(
    @Inject(LEGAL_CATALOG_REPOSITORIES.areas)
    legalAreasRepository: LegalAreasRepository,
  ) {
    this.useCase = new CreateLegalAreaUseCase(legalAreasRepository)
  }

  @Post('admin/areas')
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The legal area was created successfully.',
    type: LegalAreaResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'A legal area with the same name already exists.',
    type: ErrorResponseDto,
  })
  handle(@Body(new ZodValidationPipe(legalAreaInputSchema)) body: LegalAreaInputDto) {
    return this.useCase.execute(body as RequestBody)
  }
}
