import { Body, HttpCode, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import { createZodDto, ZodValidationPipe } from 'nestjs-zod'
import { cancelFormalizationSignatureSendingSchema } from '@hms/validation/formalization'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'

import { CancelFormalizationSignatureSendingUseCase } from '@hms/core/formalization/use-cases'
import type {
  FormalizationSignatureCancellationAttemptsRepository,
  FormalizationSignatureGatewaySessionsRepository,
  FormalizationSignatureGatewayTransaction,
  FormalizationSignatureInvitationsRepository,
  FormalizationSignatureProxyBindingsRepository,
  FormalizationSignatureRecipientsRepository,
  FormalizationSignatureRequestsRepository,
  FormalizationsRepository,
} from '@hms/core/formalization/interfaces'
import { FormalizationSignatureRequestConflictError } from '@hms/core/formalization/domain/errors'
import type { CollaboratorProfile } from '@hms/core/identity/domain/structures'
import type { Broker, DatetimeProvider, IdProvider } from '@hms/core/shared/interfaces'
import { Inject } from '@nestjs/common'
import {
  FORMALIZATION_DATABASE_OPERATIONS,
  FORMALIZATION_REPOSITORIES,
} from '@/formalization/constants'
import { DatetimeProvider as ServerDatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { IdProvider as ServerIdProvider } from '@/shared/provision/id/id-provider'
import { InngestBroker } from '@/shared/messaging/inngest/inngest-broker'
import { FormalizationsController } from '@/formalization/decorators'
import { CurrentCollaborator } from '@/identity/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { ErrorResponseDto } from '@/shared/rest/dtos'

class CancelFormalizationSignatureSendingBody extends createZodDto(
  cancelFormalizationSignatureSendingSchema,
) {}

@FormalizationsController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class CancelFormalizationSignatureSendingController {
  private readonly requestsRepository: FormalizationSignatureRequestsRepository
  private readonly useCase: CancelFormalizationSignatureSendingUseCase

  constructor(
    @Inject(FORMALIZATION_REPOSITORIES.formalizations)
    formalizationsRepository: FormalizationsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureRequests)
    requestsRepository: FormalizationSignatureRequestsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureRecipients)
    recipientsRepository: FormalizationSignatureRecipientsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureCancellationAttempts)
    cancellationsRepository: FormalizationSignatureCancellationAttemptsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureInvitations)
    invitationsRepository: FormalizationSignatureInvitationsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureGatewaySessions)
    sessionsRepository: FormalizationSignatureGatewaySessionsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureProxyBindings)
    bindingsRepository: FormalizationSignatureProxyBindingsRepository,
    @Inject(FORMALIZATION_DATABASE_OPERATIONS.signatureGatewayTransaction)
    transaction: FormalizationSignatureGatewayTransaction,
    @Inject(ServerIdProvider) idProvider: IdProvider,
    @Inject(ServerDatetimeProvider) datetimeProvider: DatetimeProvider,
    @Inject(InngestBroker) broker: Broker,
  ) {
    this.requestsRepository = requestsRepository
    this.useCase = new CancelFormalizationSignatureSendingUseCase({
      requestsRepository,
      formalizationsRepository,
      recipientsRepository,
      cancellationsRepository,
      invitationsRepository,
      sessionsRepository,
      bindingsRepository,
      transaction,
      idProvider,
      datetimeProvider,
      broker,
    })
  }

  @Post(':formalizationId/signature-sending/cancel')
  @HttpCode(200)
  @ApiResponse({
    status: 200,
    description: 'The signature sending cancellation was scheduled.',
  })
  @ApiResponse({ status: 400, type: ErrorResponseDto })
  @ApiResponse({ status: 409, type: ErrorResponseDto })
  handle(
    @Param('formalizationId', new ParseUUIDPipe()) formalizationId: string,
    @Body(new ZodValidationPipe(cancelFormalizationSignatureSendingSchema))
    body: CancelFormalizationSignatureSendingBody,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    return this.cancel({
      formalizationId,
      actorId: collaborator.collaboratorId,
      actorProfile: collaborator.profile,
      ...body,
    })
  }

  private async cancel(input: {
    formalizationId: string
    actorId: string
    actorProfile: CollaboratorProfile
    expectedRequestVersion: number
    expectedFormalizationVersion: number
    reason: string
  }) {
    const request = await this.requestsRepository.findCurrentByFormalizationId(
      input.formalizationId,
    )
    if (!request) throw new FormalizationSignatureRequestConflictError()

    return this.useCase.execute({
      requestId: request.id,
      formalizationId: input.formalizationId,
      actorId: input.actorId,
      actorProfile: input.actorProfile,
      expectedRequestVersion: input.expectedRequestVersion,
      expectedFormalizationVersion: input.expectedFormalizationVersion,
      reason: input.reason,
    })
  }
}
