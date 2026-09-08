import { Body, HttpCode, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import { createZodDto, ZodValidationPipe } from 'nestjs-zod'
import { confirmFormalizationSignatureSendingSchema } from '@hms/validation/formalization'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'

import { ConfirmFormalizationSignatureSendingUseCase } from '@hms/core/formalization/use-cases'
import type {
  FormalizationSignatureConfigurationRepository,
  FormalizationSignatureDocumentMetadataReader,
  FormalizationSignatureRequestsRepository,
  FormalizationSignatureSourceReader,
  FormalizationSignatureGatewayTransaction,
  FormalizationsRepository,
  SignatureSecretHasher,
} from '@hms/core/formalization/interfaces'
import type { Broker, DatetimeProvider, IdProvider } from '@hms/core/shared/interfaces'
import { Inject } from '@nestjs/common'
import {
  FORMALIZATION_DATABASE_OPERATIONS,
  FORMALIZATION_PROVIDERS,
  FORMALIZATION_REPOSITORIES,
} from '@/formalization/constants'
import { DatetimeProvider as ServerDatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { IdProvider as ServerIdProvider } from '@/shared/provision/id/id-provider'
import { InngestBroker } from '@/shared/messaging/inngest/inngest-broker'
import { FormalizationsController } from '@/formalization/decorators'
import { CurrentCollaborator } from '@/identity/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { ErrorResponseDto } from '@/shared/rest/dtos'

class ConfirmFormalizationSignatureSendingBody extends createZodDto(
  confirmFormalizationSignatureSendingSchema,
) {}

@FormalizationsController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class ConfirmFormalizationSignatureSendingController {
  private readonly useCase: ConfirmFormalizationSignatureSendingUseCase

  constructor(
    @Inject(FORMALIZATION_REPOSITORIES.formalizations)
    formalizationsRepository: FormalizationsRepository,
    @Inject(FORMALIZATION_PROVIDERS.signatureConfigurationRepository)
    configurationRepository: FormalizationSignatureConfigurationRepository,
    @Inject(FORMALIZATION_PROVIDERS.signatureSourceReader)
    sourceReader: FormalizationSignatureSourceReader,
    @Inject(FORMALIZATION_REPOSITORIES.signatureRequests)
    requestsRepository: FormalizationSignatureRequestsRepository,
    @Inject(FORMALIZATION_DATABASE_OPERATIONS.signatureGatewayTransaction)
    transaction: FormalizationSignatureGatewayTransaction,
    @Inject(ServerIdProvider) idProvider: IdProvider,
    @Inject(ServerDatetimeProvider) datetimeProvider: DatetimeProvider,
    @Inject(InngestBroker) broker: Broker,
    @Inject(FORMALIZATION_PROVIDERS.signatureSecretHasher) hasher: SignatureSecretHasher,
    @Inject(FORMALIZATION_PROVIDERS.documentMetadataReader)
    metadataReader: FormalizationSignatureDocumentMetadataReader,
  ) {
    this.useCase = new ConfirmFormalizationSignatureSendingUseCase({
      formalizationsRepository,
      configurationRepository,
      sourceReader,
      requestsRepository,
      transaction,
      idProvider,
      datetimeProvider,
      broker,
      hasher,
      metadataReader,
    })
  }

  @Post(':formalizationId/signature-sending/confirm')
  @HttpCode(200)
  @ApiResponse({ status: 200, description: 'The signature sending was confirmed.' })
  @ApiResponse({ status: 400, type: ErrorResponseDto })
  @ApiResponse({ status: 409, type: ErrorResponseDto })
  handle(
    @Param('formalizationId', new ParseUUIDPipe()) formalizationId: string,
    @Body(new ZodValidationPipe(confirmFormalizationSignatureSendingSchema))
    body: ConfirmFormalizationSignatureSendingBody,
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
