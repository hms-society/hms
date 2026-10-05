import { Get, HttpStatus, Inject, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import type { ThirdPartiesRepository } from '@hms/core/identity/interfaces'
import { ListThirdPartiesUseCase } from '@hms/core/identity/use-cases'

import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import { ThirdPartiesController } from '@/identity/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'

@ThirdPartiesController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class ListThirdPartiesController {
  private readonly useCase: ListThirdPartiesUseCase

  constructor(
    @Inject(IDENTITY_REPOSITORIES.thirdParties)
    thirdPartiesRepository: ThirdPartiesRepository,
  ) {
    this.useCase = new ListThirdPartiesUseCase(thirdPartiesRepository)
  }

  @Get()
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The third parties were returned successfully.',
  })
  handle() {
    return this.useCase.execute()
  }
}
