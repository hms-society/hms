import { Body, HttpStatus, Inject, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiResponse } from '@nestjs/swagger'
import type {
  AuthAdministrationProvider,
  CollaboratorRegistrationAttemptsRepository,
  CollaboratorsRepository,
  IdentityTransaction,
  UsersRepository,
} from '@hms/core/identity/interfaces'
import { RegisterCollaboratorUseCase } from '@hms/core/identity/use-cases'
import type { LegalExpertiseCatalogProvider } from '@hms/core/legal-catalog/interfaces'
import { registerCollaboratorSchema } from '@hms/validation/identity'
import { ZodValidationPipe } from 'nestjs-zod'

import { IDENTITY_PROVIDERS } from '@/identity/constants/identity-providers'
import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import { CurrentUser, CollaboratorsController } from '@/identity/decorators'
import { ActiveAdminGuard, AuthGuard } from '@/identity/guards'
import { RegisterCollaboratorRequestDto } from '@/identity/rest/dtos/register-collaborator-request.dto'
import { CollaboratorSummaryResponseDto } from '@/identity/rest/dtos'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import { EnvProvider } from '@/shared/provision/env/env-provider'
import { LEGAL_CATALOG_PROVIDERS } from '@/legal-catalog/constants/legal-catalog-providers'
import type { AuthUser } from '@hms/core/identity/domain/structures'

type ExecuteRequest = Parameters<RegisterCollaboratorUseCase['execute']>[0]
type RequestBody = NonNullable<ExecuteRequest['registration']>

@CollaboratorsController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveAdminGuard)
export class RegisterCollaboratorController {
  private readonly useCase: RegisterCollaboratorUseCase

  constructor(
    @Inject(IDENTITY_REPOSITORIES.users)
    usersRepository: UsersRepository,
    @Inject(IDENTITY_REPOSITORIES.collaborators)
    collaboratorsRepository: CollaboratorsRepository,
    @Inject(IDENTITY_REPOSITORIES.registrationAttempts)
    registrationAttemptsRepository: CollaboratorRegistrationAttemptsRepository,
    @Inject(IDENTITY_REPOSITORIES.transaction)
    identityTransaction: IdentityTransaction,
    @Inject(IDENTITY_PROVIDERS.authAdministration)
    authAdministrationProvider: AuthAdministrationProvider,
    @Inject(LEGAL_CATALOG_PROVIDERS.legalExpertiseCatalog)
    legalExpertiseCatalogProvider: LegalExpertiseCatalogProvider,
    @Inject(EnvProvider) private readonly envProvider: EnvProvider,
  ) {
    this.useCase = new RegisterCollaboratorUseCase(
      usersRepository,
      collaboratorsRepository,
      registrationAttemptsRepository,
      identityTransaction,
      authAdministrationProvider,
      legalExpertiseCatalogProvider,
    )
  }

  @Post()
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The collaborator invitation and local registration were completed.',
    type: CollaboratorSummaryResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'The collaborator data are invalid.',
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
    status: HttpStatus.CONFLICT,
    description:
      'The collaborator registration conflicts with an existing account or attempt.',
    type: ErrorResponseDto,
  })
  @ApiBody({ type: RegisterCollaboratorRequestDto })
  handle(
    @CurrentUser() authUser: AuthUser,
    @Body(new ZodValidationPipe(registerCollaboratorSchema)) body: RequestBody,
  ) {
    return this.useCase.execute({
      authUser,
      registration: body,
      invitationRedirectTo: `${this.envProvider.get('HMS_WEB_APP_URL')}/convite`,
    })
  }
}
