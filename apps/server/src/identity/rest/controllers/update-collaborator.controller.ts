import { Body, HttpStatus, Inject, Param, Patch, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiResponse } from '@nestjs/swagger'
import type {
  CollaboratorsRepository,
  UsersRepository,
} from '@hms/core/identity/interfaces'
import type { LegalExpertiseCatalogProvider } from '@hms/core/legal-catalog/interfaces'
import {
  AuthorizeAdminUseCase,
  UpdateCollaboratorUseCase,
} from '@hms/core/identity/use-cases'
import type { AuthUser } from '@hms/core/identity/domain/structures'
import { updateCollaboratorSchema } from '@hms/validation/identity'
import { ZodValidationPipe } from 'nestjs-zod'

import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import { CollaboratorsController, CurrentUser } from '@/identity/decorators'
import { ActiveAdminGuard, AuthGuard } from '@/identity/guards'
import { LEGAL_CATALOG_PROVIDERS } from '@/legal-catalog/constants/legal-catalog-providers'
import {
  CollaboratorSummaryResponseDto,
  UpdateCollaboratorRequestDto,
} from '@/identity/rest/dtos'
import { ErrorResponseDto } from '@/shared/rest/dtos'

type ExecuteRequest = Parameters<UpdateCollaboratorUseCase['execute']>[0]
type RequestBody = ExecuteRequest['changes']

@CollaboratorsController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveAdminGuard)
export class UpdateCollaboratorController {
  private readonly useCase: UpdateCollaboratorUseCase

  constructor(
    @Inject(IDENTITY_REPOSITORIES.collaborators)
    collaboratorsRepository: CollaboratorsRepository,
    @Inject(IDENTITY_REPOSITORIES.users) usersRepository: UsersRepository,
    @Inject(LEGAL_CATALOG_PROVIDERS.legalExpertiseCatalog)
    legalExpertiseCatalogProvider: LegalExpertiseCatalogProvider,
  ) {
    this.useCase = new UpdateCollaboratorUseCase(
      collaboratorsRepository,
      new AuthorizeAdminUseCase(usersRepository, collaboratorsRepository),
      legalExpertiseCatalogProvider,
    )
  }

  @Patch(':collaboratorId')
  @ApiBody({ type: UpdateCollaboratorRequestDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The collaborator was updated successfully.',
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
    status: HttpStatus.NOT_FOUND,
    description: 'The collaborator was not found.',
    type: ErrorResponseDto,
  })
  handle(
    @CurrentUser() authUser: AuthUser,
    @Param('collaboratorId') collaboratorId: string,
    @Body(new ZodValidationPipe(updateCollaboratorSchema)) body: RequestBody,
  ) {
    return this.useCase.execute({ authUser, collaboratorId, changes: body })
  }
}
