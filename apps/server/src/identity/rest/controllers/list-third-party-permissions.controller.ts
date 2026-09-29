import { Get, HttpStatus, Inject, Param, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import type { ThirdPartyPermissionsRepository } from '@hms/core/identity/interfaces'
import { ListThirdPartyPermissionsUseCase } from '@hms/core/identity/use-cases'

import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import { ThirdPartiesController } from '@/identity/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'

@ThirdPartiesController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class ListThirdPartyPermissionsController {
  private readonly useCase: ListThirdPartyPermissionsUseCase

  constructor(
    @Inject(IDENTITY_REPOSITORIES.thirdPartyPermissions)
    permissionsRepository: ThirdPartyPermissionsRepository,
  ) {
    this.useCase = new ListThirdPartyPermissionsUseCase(permissionsRepository)
  }

  @Get(':thirdPartyId/permissions')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The third party permissions were returned.',
  })
  handle(@Param('thirdPartyId') thirdPartyId: string) {
    return this.useCase.execute({ thirdPartyId })
  }
}
