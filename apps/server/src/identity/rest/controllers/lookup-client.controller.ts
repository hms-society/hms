import { Body, HttpCode, HttpStatus, Inject, Post, UsePipes } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import type {
  ClientConsentsRepository,
  ClientsRepository,
} from '@hms/core/identity/interfaces'
import { LookupClientUseCase } from '@hms/core/identity/use-cases'
import { lookupClientSchema } from '@hms/validation/identity'
import { createZodDto, ZodValidationPipe } from 'nestjs-zod'

import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import { ClientsController } from '@/identity/decorators'
import { ClientDetailsResponseDto } from '@/identity/rest/dtos/client-details-response.dto'
import { ErrorResponseDto } from '@/shared/rest/dtos'

class LookupClientControllerRequestBody extends createZodDto(lookupClientSchema) {}

@ClientsController()
export class LookupClientController {
  private readonly useCase: LookupClientUseCase

  constructor(
    @Inject(IDENTITY_REPOSITORIES.clients)
    clientsRepository: ClientsRepository,
    @Inject(IDENTITY_REPOSITORIES.clientConsents)
    clientConsentsRepository: ClientConsentsRepository,
  ) {
    this.useCase = new LookupClientUseCase(clientsRepository, clientConsentsRepository)
  }

  @Post('lookup')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The matching client and their consents were returned successfully.',
    type: ClientDetailsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'The lookup criteria are invalid.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No client matched the lookup criteria.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'The lookup criteria match more than one client.',
    type: ErrorResponseDto,
  })
  @UsePipes(ZodValidationPipe)
  handle(@Body() body: LookupClientControllerRequestBody) {
    return this.useCase.execute(body)
  }
}
