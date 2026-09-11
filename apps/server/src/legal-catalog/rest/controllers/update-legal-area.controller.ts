import { Body, HttpStatus, Inject, Param, Patch, UseGuards } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import type { LegalAreasRepository } from '@hms/core/legal-catalog/interfaces'
import { UpdateLegalAreaUseCase } from '@hms/core/legal-catalog/use-cases'
import { legalAreaUpdateSchema } from '@hms/validation/legal-catalog'
import { ZodValidationPipe } from 'nestjs-zod'

import { LEGAL_CATALOG_REPOSITORIES } from '@/legal-catalog/constants/legal-catalog-repositories'
import { LegalCatalogController } from '@/legal-catalog/decorators'
import { LegalAreaResponseDto, LegalAreaUpdateDto } from '@/legal-catalog/rest/dtos'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import { ActiveAdminGuard, AuthGuard } from '@/identity/guards'

type RequestBody = Omit<Parameters<UpdateLegalAreaUseCase['execute']>[0], 'legalAreaId'>

@LegalCatalogController()
@UseGuards(AuthGuard, ActiveAdminGuard)
export class UpdateLegalAreaController {
  private readonly useCase: UpdateLegalAreaUseCase

  constructor(
    @Inject(LEGAL_CATALOG_REPOSITORIES.areas)
    legalAreasRepository: LegalAreasRepository,
  ) {
    this.useCase = new UpdateLegalAreaUseCase(legalAreasRepository)
  }

  @Patch('admin/areas/:legalAreaId')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The legal area was updated successfully.',
    type: LegalAreaResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The legal area was not found.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'A legal area with the same name already exists.',
    type: ErrorResponseDto,
  })
  handle(
    @Param('legalAreaId') legalAreaId: string,
    @Body(new ZodValidationPipe(legalAreaUpdateSchema)) body: LegalAreaUpdateDto,
  ) {
    return this.useCase.execute({ legalAreaId, ...(body as RequestBody) })
  }
}
