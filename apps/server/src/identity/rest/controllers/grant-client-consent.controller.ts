import { Body, HttpStatus, Inject, Param, Post, UsePipes } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import type {
  ClientConsentsRepository,
  ClientsRepository,
} from '@hms/core/identity/interfaces'
import { GrantClientConsentUseCase } from '@hms/core/identity/use-cases'
import { grantClientConsentSchema } from '@hms/validation/identity'
import { createZodDto, ZodValidationPipe } from 'nestjs-zod'

import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import { ClientsController } from '@/identity/decorators'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'

class GrantClientConsentControllerRequestBody extends createZodDto(
  grantClientConsentSchema,
) {}

@ClientsController()
export class GrantClientConsentController {
  private readonly useCase: GrantClientConsentUseCase

  constructor(
    @Inject(IDENTITY_REPOSITORIES.clients)
    clientsRepository: ClientsRepository,
    @Inject(IDENTITY_REPOSITORIES.clientConsents)
    clientConsentsRepository: ClientConsentsRepository,
    datetimeProvider: DatetimeProvider,
  ) {
    this.useCase = new GrantClientConsentUseCase(
      clientsRepository,
      clientConsentsRepository,
      datetimeProvider,
    )
  }

  @Post(':clientId/consents')
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The client consent was granted successfully.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'The consent data are invalid.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The client was not found.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'The client consent is already active.',
    type: ErrorResponseDto,
  })
  @UsePipes(ZodValidationPipe)
  handle(
    @Param('clientId') clientId: string,
    @Body() body: GrantClientConsentControllerRequestBody,
  ) {
    return this.useCase.execute({ clientId, type: body.type })
  }
}
