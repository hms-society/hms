import { HttpCode, HttpStatus, Inject, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import type {
  AuthAdministrationProvider,
  CollaboratorsRepository,
  IdentityTransaction,
  UsersRepository,
} from '@hms/core/identity/interfaces'
import { CompleteSignInUseCase } from '@hms/core/identity/use-cases'
import type { AuthUser } from '@hms/core/identity/domain/structures'

import { IDENTITY_PROVIDERS } from '@/identity/constants/identity-providers'
import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import { AuthController, CurrentAuth, CurrentUser } from '@/identity/decorators'
import { AuthGuard } from '@/identity/guards'
import { CollaboratorSummaryResponseDto } from '@/identity/rest/dtos'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import type { AuthSession } from '@hms/core/identity/domain/structures'

@AuthController()
@ApiBearerAuth()
@UseGuards(AuthGuard)
export class CompleteSignInController {
  private readonly useCase: CompleteSignInUseCase

  constructor(
    @Inject(IDENTITY_REPOSITORIES.users)
    usersRepository: UsersRepository,
    @Inject(IDENTITY_REPOSITORIES.collaborators)
    collaboratorsRepository: CollaboratorsRepository,
    @Inject(IDENTITY_REPOSITORIES.transaction)
    identityTransaction: IdentityTransaction,
    @Inject(IDENTITY_PROVIDERS.authAdministration)
    authAdministrationProvider: AuthAdministrationProvider,
    datetimeProvider: DatetimeProvider,
  ) {
    this.useCase = new CompleteSignInUseCase(
      usersRepository,
      collaboratorsRepository,
      identityTransaction,
      authAdministrationProvider,
      datetimeProvider,
    )
  }

  @Post('complete-sign-in')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The local sign-in was completed and the collaborator was returned.',
    type: CollaboratorSummaryResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'The authentication session is missing or invalid.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The local user or collaborator was not found.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'The account is disabled.',
    type: ErrorResponseDto,
  })
  handle(@CurrentUser() authUser: AuthUser, @CurrentAuth() authSession: AuthSession) {
    return this.useCase.execute({
      authUser,
      accessToken: authSession.accessToken,
    })
  }
}
