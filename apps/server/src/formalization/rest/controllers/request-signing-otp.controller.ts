import { SigningGatewayController } from '@/formalization/rest/controllers/signing-gateway.controller'
import { Body, Headers, HttpCode, HttpStatus, Inject, Post, Req } from '@nestjs/common'
import { createZodDto, ZodValidationPipe } from 'nestjs-zod'
import type { Request } from 'express'
import { requestSignatureOtpSchema } from '@hms/validation/formalization'
import { RequestSignatureOtpUseCase } from '@hms/core/formalization/use-cases'
import type {
  FormalizationSignatureGatewaySessionsRepository,
  FormalizationSignatureRecipientsRepository,
  FormalizationSignatureInvitationsRepository,
  FormalizationSignatureSourceReader,
  FormalizationSignatureOtpChallengesRepository,
  FormalizationSignatureOtpGuardsRepository,
  FormalizationSignatureOtpRateReservationsRepository,
  FormalizationSignatureOtpSendAttemptsRepository,
  SensitivePayloadCipherProvider,
  FormalizationSignatureGatewayTransaction,
  SignatureSecretHasher,
  SignatureOtpMacProvider,
} from '@hms/core/formalization/interfaces'
import type { Broker, DatetimeProvider, IdProvider } from '@hms/core/shared/interfaces'
import { SigningGatewayController as SigningGatewayRoute } from '@/formalization/decorators'
import {
  FORMALIZATION_DATABASE_OPERATIONS,
  FORMALIZATION_REPOSITORIES,
} from '@/formalization/constants/formalization-repositories'
import { FORMALIZATION_PROVIDERS } from '@/formalization/constants/formalization-providers'
import { DatetimeProvider as ServerDatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { IdProvider as ServerIdProvider } from '@/shared/provision/id/id-provider'
import { InngestBroker } from '@/shared/messaging/inngest/inngest-broker'
import {
  FLOW_COOKIE,
  DEVICE_COOKIE,
} from '@/formalization/rest/controllers/signing-gateway.controller'
class RequestOtpBody extends createZodDto(requestSignatureOtpSchema) {}
@SigningGatewayRoute()
export class RequestSigningOtpController extends SigningGatewayController {
  private readonly useCase: RequestSignatureOtpUseCase
  constructor(
    @Inject(FORMALIZATION_REPOSITORIES.signatureGatewaySessions)
    sessionsRepository: FormalizationSignatureGatewaySessionsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureRecipients)
    recipientsRepository: FormalizationSignatureRecipientsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureInvitations)
    invitationsRepository: FormalizationSignatureInvitationsRepository,
    @Inject(FORMALIZATION_PROVIDERS.signatureSourceReader)
    sourceReader: FormalizationSignatureSourceReader,
    @Inject(FORMALIZATION_REPOSITORIES.signatureOtpChallenges)
    challengesRepository: FormalizationSignatureOtpChallengesRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureOtpGuards)
    guardsRepository: FormalizationSignatureOtpGuardsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureOtpRateReservations)
    reservationsRepository: FormalizationSignatureOtpRateReservationsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureOtpSendAttempts)
    sendAttemptsRepository: FormalizationSignatureOtpSendAttemptsRepository,
    @Inject(FORMALIZATION_PROVIDERS.sensitivePayloadCipher)
    cipher: SensitivePayloadCipherProvider,
    @Inject(FORMALIZATION_DATABASE_OPERATIONS.signatureGatewayTransaction)
    transaction: FormalizationSignatureGatewayTransaction,
    @Inject(ServerIdProvider) idProvider: IdProvider,
    @Inject(FORMALIZATION_PROVIDERS.signatureSecretGenerator) secretGenerator: {
      generate(): string
      generateNumeric(length: number): string
    },
    @Inject(ServerDatetimeProvider) datetimeProvider: DatetimeProvider,
    @Inject(InngestBroker) broker: Broker,
    @Inject(FORMALIZATION_PROVIDERS.signatureSecretHasher) hasher: SignatureSecretHasher,
    @Inject(FORMALIZATION_PROVIDERS.signatureOtpMacProvider)
    macProvider: SignatureOtpMacProvider,
  ) {
    super()
    this.useCase = new RequestSignatureOtpUseCase({
      sessionsRepository,
      recipientsRepository,
      invitationsRepository,
      sourceReader,
      challengesRepository,
      guardsRepository,
      reservationsRepository,
      sendAttemptsRepository,
      cipher,
      transaction,
      idProvider,
      secretGenerator,
      datetimeProvider,
      broker,
      hasher,
      macProvider,
    })
  }
  @Post('otp')
  @HttpCode(HttpStatus.OK)
  handle(
    @Body(new ZodValidationPipe(requestSignatureOtpSchema)) body: RequestOtpBody,
    @Req() request: Request,
    @Headers('X-HMS-Signing-CSRF') csrfToken: string,
  ) {
    return this.useCase
      .execute({
        flowToken: this.getGatewayCookie(request, FLOW_COOKIE),
        deviceToken: this.getGatewayCookie(request, DEVICE_COOKIE),
        csrfToken: this.requireGatewayValue(csrfToken, 'csrf'),
        channelChoiceId: body.channelChoiceId,
        sourceIpHash: this.hashGatewayFingerprint(request.ip ?? ''),
      })
      .then((result) => ({
        challengeId: result.challengeId,
        expiresAt: result.expiresAt.toISOString(),
        resendAvailableAt: result.resendAvailableAt.toISOString(),
      }))
  }
}
