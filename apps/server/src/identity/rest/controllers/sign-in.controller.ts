import { Body, HttpCode, HttpStatus, Inject, Post, UsePipes } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import type { AuthProvider } from '@hms/core/identity/interfaces'
import { SignInUseCase } from '@hms/core/identity/use-cases'
import { signInSchema } from '@hms/validation/identity'
import { createZodDto, ZodValidationPipe } from 'nestjs-zod'

import { IDENTITY_PROVIDERS } from '@/identity/constants/identity-providers'
import { AuthController } from '@/identity/decorators'
import { AuthSessionResponseDto } from '@/identity/rest/dtos/auth-session-response.dto'
import { ErrorResponseDto } from '@/shared/rest/dtos'

class SignInRequestBody extends createZodDto(signInSchema) {}

@AuthController()
export class SignInController {
  private readonly useCase: SignInUseCase

  constructor(@Inject(IDENTITY_PROVIDERS.auth) authProvider: AuthProvider) {
    this.useCase = new SignInUseCase(authProvider)
  }

  @Post('sign-in')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The authentication session was created successfully.',
    type: AuthSessionResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'The sign-in credentials are invalid.',
    type: ErrorResponseDto,
  })
  @UsePipes(ZodValidationPipe)
  handle(@Body() body: SignInRequestBody) {
    return this.useCase.execute(body)
  }
}
