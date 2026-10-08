import { HttpCode, HttpStatus, Inject, Param, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import type {
  AuthAdministrationProvider,
  CollaboratorsRepository,
  UsersRepository,
} from '@hms/core/identity/interfaces'
import {
  AuthorizeAdminUseCase,
  DeactivateCollaboratorUseCase,
} from '@hms/core/identity/use-cases'
import type { CaseIdentityTransaction } from '@hms/core/shared/interfaces'
import { EnsureCaseManagerContinuityUseCase } from '@hms/core/case-management/use-cases'
import type { AuthUser } from '@hms/core/identity/domain/structures'

import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import { IDENTITY_PROVIDERS } from '@/identity/constants/identity-providers'
import { CollaboratorsController, CurrentUser } from '@/identity/decorators'
import { ActiveAdminGuard, AuthGuard } from '@/identity/guards'
import { CollaboratorSummaryResponseDto } from '@/identity/rest/dtos'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import { CASE_IDENTITY_TRANSACTION } from '@/shared/database/constants/case-identity-transaction'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { IdProvider } from '@/shared/provision/id/id-provider'

@CollaboratorsController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveAdminGuard)
export class DeactivateCollaboratorController {
  private readonly useCase: DeactivateCollaboratorUseCase

  constructor(
    @Inject(IDENTITY_REPOSITORIES.users) usersRepository: UsersRepository,
    @Inject(IDENTITY_REPOSITORIES.collaborators)
    collaboratorsRepository: CollaboratorsRepository,
    @Inject(IDENTITY_PROVIDERS.authAdministration)
    authAdministrationProvider: AuthAdministrationProvider,
    @Inject(CASE_IDENTITY_TRANSACTION)
    caseIdentityTransaction: CaseIdentityTransaction,
    datetimeProvider: DatetimeProvider,
    idProvider: IdProvider,
  ) {
    const authorizeAdminUseCase = new AuthorizeAdminUseCase(
      usersRepository,
      collaboratorsRepository,
    )
    this.useCase = new DeactivateCollaboratorUseCase(
      collaboratorsRepository,
      authAdministrationProvider,
      (authUser) => authorizeAdminUseCase.execute({ authUser }),
      caseIdentityTransaction,
      new EnsureCaseManagerContinuityUseCase(caseIdentityTransaction, datetimeProvider),
      idProvider,
    )
  }

  @Post(':collaboratorId/deactivate')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The collaborator access was deactivated.',
    type: CollaboratorSummaryResponseDto,
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
    description: 'The collaborator was not found.',
    type: ErrorResponseDto,
  })
  handle(
    @CurrentUser() authUser: AuthUser,
    @Param('collaboratorId') collaboratorId: string,
  ) {
    return this.useCase.execute({ authUser, collaboratorId })
  }
}
