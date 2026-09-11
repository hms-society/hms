import { Body, HttpStatus, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import { createZodDto, ZodValidationPipe } from 'nestjs-zod'
import { resendFormalizationSignatureInvitationSchema } from '@hms/validation/formalization'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import { ResendFormalizationSignatureInvitationUseCase } from '@hms/core/formalization/use-cases'
import type {
  FormalizationSignatureGatewaySessionsRepository,
  FormalizationSignatureInvitationResendTransaction,
  FormalizationSignatureInvitationsRepository,
  FormalizationSignatureProxyBindingsRepository,
  FormalizationSignatureRecipientsRepository,
  FormalizationSignatureRequestsRepository,
  FormalizationsRepository,
  FormalizationSignatureSourceReader,
  SensitivePayloadCipherProvider,
  SignatureSecretHasher,
} from '@hms/core/formalization/interfaces'
import type { Broker, DatetimeProvider, IdProvider } from '@hms/core/shared/interfaces'
import { Inject } from '@nestjs/common'
import {
  FORMALIZATION_DATABASE_OPERATIONS,
  FORMALIZATION_REPOSITORIES,
  FORMALIZATION_PROVIDERS,
} from '@/formalization/constants'
import { FormalizationsController } from '@/formalization/decorators'
import { CurrentCollaborator } from '@/identity/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { DatetimeProvider as ServerDatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { IdProvider as ServerIdProvider } from '@/shared/provision/id/id-provider'
import { InngestBroker } from '@/shared/messaging/inngest/inngest-broker'
import { ErrorResponseDto } from '@/shared/rest/dtos'

class ResendFormalizationSignatureInvitationBody extends createZodDto(
  resendFormalizationSignatureInvitationSchema,
) {}
type RequestBody = Omit<
  Parameters<ResendFormalizationSignatureInvitationUseCase['execute']>[0],
  'formalizationId' | 'recipientId' | 'actorId' | 'actorProfile'
>

@FormalizationsController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class ResendFormalizationSignatureInvitationController {
  private readonly useCase: ResendFormalizationSignatureInvitationUseCase

  constructor(
    @Inject(FORMALIZATION_REPOSITORIES.formalizations)
    formalizationsRepository: FormalizationsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureRequests)
    requestsRepository: FormalizationSignatureRequestsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureRecipients)
    recipientsRepository: FormalizationSignatureRecipientsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureInvitations)
    invitationsRepository: FormalizationSignatureInvitationsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureGatewaySessions)
    sessionsRepository: FormalizationSignatureGatewaySessionsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureProxyBindings)
    bindingsRepository: FormalizationSignatureProxyBindingsRepository,
    @Inject(FORMALIZATION_PROVIDERS.signatureSourceReader)
    sourceReader: FormalizationSignatureSourceReader,
    @Inject(FORMALIZATION_PROVIDERS.sensitivePayloadCipher)
    cipher: SensitivePayloadCipherProvider,
    @Inject(FORMALIZATION_PROVIDERS.signatureSecretHasher) hasher: SignatureSecretHasher,
    @Inject(FORMALIZATION_PROVIDERS.signatureSecretGenerator) secretGenerator: {
      generate(): string
    },
    @Inject(FORMALIZATION_DATABASE_OPERATIONS.invitationResendTransaction)
    transaction: FormalizationSignatureInvitationResendTransaction,
    @Inject(ServerDatetimeProvider) datetimeProvider: DatetimeProvider,
    @Inject(ServerIdProvider) idProvider: IdProvider,
    @Inject(InngestBroker) broker: Broker,
  ) {
    this.useCase = new ResendFormalizationSignatureInvitationUseCase({
      formalizationsRepository,
      requestsRepository,
      recipientsRepository,
      invitationsRepository,
      sessionsRepository,
      bindingsRepository,
      sourceReader,
      transaction,
      cipher,
      hasher,
      secretGenerator,
      datetimeProvider,
      idProvider,
      broker,
    })
  }

  @Post(':formalizationId/signature-sending/recipients/:recipientId/resend')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The invitation resend was scheduled.',
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.CONFLICT, type: ErrorResponseDto })
  handle(
    @Param('formalizationId', new ParseUUIDPipe()) formalizationId: string,
    @Param('recipientId', new ParseUUIDPipe()) recipientId: string,
    @Body(new ZodValidationPipe(resendFormalizationSignatureInvitationSchema))
    body: ResendFormalizationSignatureInvitationBody,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    return this.useCase.execute({
      ...(body as RequestBody),
      formalizationId,
      recipientId,
      actorId: collaborator.collaboratorId,
      actorProfile: collaborator.profile,
    })
  }
}
