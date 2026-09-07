import {
  Body,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import { createZodDto, ZodValidationPipe } from 'nestjs-zod'
import { initializeFormalizationSignatureConfigurationSchema } from '@hms/validation/formalization'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import { InitializeFormalizationSignatureConfigurationUseCase } from '@hms/core/formalization/use-cases'
import type {
  FormalizationDocumentConfirmationTransaction,
  FormalizationsRepository,
  FormalizationSignatureConfigurationRepository,
} from '@hms/core/formalization/interfaces'

import { FORMALIZATION_PROVIDERS } from '@/formalization/constants/formalization-providers'
import { FORMALIZATION_REPOSITORIES } from '@/formalization/constants/formalization-repositories'
import { FormalizationsController } from '@/formalization/decorators'
import { CurrentCollaborator } from '@/identity/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import { InngestBroker } from '@/shared/messaging/inngest/inngest-broker'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { Inject } from '@nestjs/common'

type RequestBody = Omit<
  Parameters<InitializeFormalizationSignatureConfigurationUseCase['execute']>[0],
  'formalizationId' | 'actorId' | 'actorProfile'
>

class InitializeFormalizationSignatureConfigurationBody extends createZodDto(
  initializeFormalizationSignatureConfigurationSchema,
) {}

@FormalizationsController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class InitializeFormalizationSignatureConfigurationController {
  private readonly useCase: InitializeFormalizationSignatureConfigurationUseCase

  constructor(
    @Inject(FORMALIZATION_REPOSITORIES.formalizations)
    formalizationsRepository: FormalizationsRepository,
    @Inject(FORMALIZATION_PROVIDERS.documentConfirmationTransaction)
    confirmationTransaction: FormalizationDocumentConfirmationTransaction,
    @Inject(FORMALIZATION_PROVIDERS.signatureConfigurationRepository)
    signatureConfigurationRepository: FormalizationSignatureConfigurationRepository,
    broker: InngestBroker,
    datetimeProvider: DatetimeProvider,
  ) {
    this.useCase = new InitializeFormalizationSignatureConfigurationUseCase(
      formalizationsRepository,
      confirmationTransaction,
      signatureConfigurationRepository,
      broker,
      datetimeProvider,
    )
  }

  @Post(':formalizationId/signature-configuration/initialize')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The signature configuration was initialized.',
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.CONFLICT, type: ErrorResponseDto })
  handle(
    @Param('formalizationId', new ParseUUIDPipe()) formalizationId: string,
    @Body(new ZodValidationPipe(initializeFormalizationSignatureConfigurationSchema))
    body: InitializeFormalizationSignatureConfigurationBody & RequestBody,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    return this.useCase.execute({
      formalizationId,
      actorId: collaborator.collaboratorId,
      actorProfile: collaborator.profile,
      ...body,
    })
  }
}
