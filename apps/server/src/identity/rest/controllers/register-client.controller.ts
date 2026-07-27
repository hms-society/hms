import { Body, HttpStatus, Inject, Post, UsePipes } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import type { ClientsRepository } from '@hms/core/identity/interfaces'
import { RegisterClientUseCase } from '@hms/core/identity/use-cases'
import { registerClientRequestSchema } from '@hms/validation/identity'
import { createZodDto, ZodValidationPipe } from 'nestjs-zod'

import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import { ClientsController } from '@/identity/decorators'
import { ClientDetailsResponseDto } from '@/identity/rest/dtos/client-details-response.dto'
import { ErrorResponseDto } from '@/shared/rest/dtos'

class RegisterClientControllerRequestBody extends createZodDto(registerClientRequestSchema) {}

@ClientsController()
export class RegisterClientController {
  private readonly useCase: RegisterClientUseCase

  constructor(
    @Inject(IDENTITY_REPOSITORIES.clients)
    clientsRepository: ClientsRepository,
  ) {
    this.useCase = new RegisterClientUseCase(clientsRepository)
  }

  @Post()
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The client was registered successfully.',
    type: ClientDetailsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'The client data are invalid.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'A client with the same tax identifier already exists.',
    type: ErrorResponseDto,
  })
  @UsePipes(ZodValidationPipe)
  handle(@Body() body: RegisterClientControllerRequestBody) {
    return this.useCase.execute(body)
  }
}
