import { Get, HttpStatus, Inject, Param, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import type { ThirdPartiesRepository } from '@hms/core/identity/interfaces'
import { GetThirdPartyUseCase } from '@hms/core/identity/use-cases'

import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import { ThirdPartiesController } from '@/identity/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { ErrorResponseDto } from '@/shared/rest/dtos'

@ThirdPartiesController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class GetThirdPartyController {
  private readonly useCase: GetThirdPartyUseCase

  constructor(
    @Inject(IDENTITY_REPOSITORIES.thirdParties)
    thirdPartiesRepository: ThirdPartiesRepository,
  ) {
    this.useCase = new GetThirdPartyUseCase(thirdPartiesRepository)
  }

  @Get(':thirdPartyId')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The third party was returned successfully.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The third party was not found.',
    type: ErrorResponseDto,
  })
  handle(@Param('thirdPartyId') thirdPartyId: string) {
    return this.useCase.execute({ thirdPartyId })
  }
}
