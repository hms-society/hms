import {
  Body,
  HttpStatus,
  Inject,
  Param,
  Post,
  UseGuards,
  UsePipes,
} from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import { CloseIntakeWithoutContractUseCase } from '@hms/core/intake/use-cases'
import type { IntakesRepository } from '@hms/core/intake/interfaces'
import { closeIntakeWithoutContractSchema } from '@hms/validation/intake'
import { createZodDto, ZodValidationPipe } from 'nestjs-zod'

import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { INTAKE_REPOSITORIES } from '@/intake/constants/intake-repositories'
import { IntakesController } from '@/intake/decorators'
import { AuthGuard } from '@/identity/guards'
import { IntakeResponseDto } from '@/intake/rest/dtos/intake-response.dto'
import { ErrorResponseDto } from '@/shared/rest/dtos'

class CloseIntakeWithoutContractControllerRequestBody extends createZodDto(
  closeIntakeWithoutContractSchema,
) {}

@IntakesController()
@UseGuards(AuthGuard)
export class CloseIntakeWithoutContractController {
  private readonly useCase: CloseIntakeWithoutContractUseCase

  constructor(
    @Inject(INTAKE_REPOSITORIES.intakes) intakesRepository: IntakesRepository,
    datetimeProvider: DatetimeProvider,
  ) {
    this.useCase = new CloseIntakeWithoutContractUseCase(
      intakesRepository,
      datetimeProvider,
    )
  }

  @Post(':intakeId/close')
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The intake was closed without a contract successfully.',
    type: IntakeResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'The closure data are invalid.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The intake was not found.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'The intake cannot be closed or its version is outdated.',
    type: ErrorResponseDto,
  })
  @UsePipes(ZodValidationPipe)
  handle(
    @Param('intakeId') intakeId: string,
    @Body() body: CloseIntakeWithoutContractControllerRequestBody,
  ) {
    return this.useCase.execute({ intakeId, ...body })
  }
}
