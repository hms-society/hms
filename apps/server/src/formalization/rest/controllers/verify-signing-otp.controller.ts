import { SigningGatewayController } from '@/formalization/rest/controllers/signing-gateway.controller'
import {
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Req,
  Res,
} from '@nestjs/common'
import { createZodDto, ZodValidationPipe } from 'nestjs-zod'
import type { Request, Response } from 'express'
import { verifySignatureOtpSchema } from '@hms/validation/formalization'
import {
  VerifySignatureOtpUseCase,
  GetSignatureGatewayContextUseCase,
} from '@hms/core/formalization/use-cases'
import type {
  FormalizationSignatureGatewaySessionsRepository,
  FormalizationSignatureRecipientsRepository,
  FormalizationSignatureRequestsRepository,
  FormalizationSignatureInvitationsRepository,
  FormalizationSignatureOtpChallengesRepository,
  FormalizationSignatureOtpGuardsRepository,
  FormalizationSignatureGatewayTransaction,
  SignatureSecretVerifier,
  SignatureSecretHasher,
  FormalizationSignatureSourceReader,
  FormalizationSignatureRequestDocumentsRepository,
  FormalizationSignatureProtocolsRepository,
  FormalizationSignatureRecipientDocumentsRepository,
  FormalizationSignatureDocumentAcknowledgementsRepository,
  FormalizationSignatureProxyBindingsRepository,
} from '@hms/core/formalization/interfaces'
import type { DatetimeProvider, IdProvider } from '@hms/core/shared/interfaces'
import { SigningGatewayController as SigningGatewayRoute } from '@/formalization/decorators'
import {
  FORMALIZATION_DATABASE_OPERATIONS,
  FORMALIZATION_REPOSITORIES,
} from '@/formalization/constants/formalization-repositories'
import { FORMALIZATION_PROVIDERS } from '@/formalization/constants/formalization-providers'
import { DatetimeProvider as ServerDatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { IdProvider as ServerIdProvider } from '@/shared/provision/id/id-provider'
import {
  FLOW_COOKIE,
  DEVICE_COOKIE,
} from '@/formalization/rest/controllers/signing-gateway.controller'
class VerifyOtpBody extends createZodDto(verifySignatureOtpSchema) {}
@SigningGatewayRoute()
export class VerifySigningOtpController extends SigningGatewayController {
  private readonly useCase: VerifySignatureOtpUseCase
  private readonly contextUseCase: GetSignatureGatewayContextUseCase
  constructor(
    @Inject(FORMALIZATION_REPOSITORIES.signatureGatewaySessions)
    sessionsRepository: FormalizationSignatureGatewaySessionsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureRecipients)
    recipientsRepository: FormalizationSignatureRecipientsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureRequests)
    requestsRepository: FormalizationSignatureRequestsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureInvitations)
    invitationsRepository: FormalizationSignatureInvitationsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureOtpChallenges)
    challengesRepository: FormalizationSignatureOtpChallengesRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureOtpGuards)
    guardsRepository: FormalizationSignatureOtpGuardsRepository,
    @Inject(FORMALIZATION_DATABASE_OPERATIONS.signatureGatewayTransaction)
    transaction: FormalizationSignatureGatewayTransaction,
    @Inject(ServerIdProvider) idProvider: IdProvider,
    @Inject(ServerDatetimeProvider) datetimeProvider: DatetimeProvider,
    @Inject(FORMALIZATION_PROVIDERS.signatureSecretVerifier)
    verifier: SignatureSecretVerifier,
    @Inject(FORMALIZATION_PROVIDERS.signatureSecretHasher) hasher: SignatureSecretHasher,
    @Inject(FORMALIZATION_REPOSITORIES.signatureRequestDocuments)
    documentsRepository: FormalizationSignatureRequestDocumentsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureProtocols)
    protocolsRepository: FormalizationSignatureProtocolsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureRecipientDocuments)
    assignmentsRepository: FormalizationSignatureRecipientDocumentsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureDocumentAcknowledgements)
    acknowledgementsRepository: FormalizationSignatureDocumentAcknowledgementsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureProxyBindings)
    bindingsRepository: FormalizationSignatureProxyBindingsRepository,
    @Inject(FORMALIZATION_PROVIDERS.signatureSourceReader)
    sourceReader: FormalizationSignatureSourceReader,
    @Inject(FORMALIZATION_PROVIDERS.signatureSecretGenerator) secretGenerator: {
      generate(): string
    },
  ) {
    super()
    this.useCase = new VerifySignatureOtpUseCase({
      sessionsRepository,
      recipientsRepository,
      requestsRepository,
      invitationsRepository,
      challengesRepository,
      guardsRepository,
      transaction,
      idProvider,
      secretGenerator: idProvider,
      datetimeProvider,
      verifier,
      hasher,
    })
    this.contextUseCase = new GetSignatureGatewayContextUseCase({
      sessionsRepository,
      recipientsRepository,
      documentsRepository,
      requestsRepository,
      protocolsRepository,
      assignmentsRepository,
      acknowledgementsRepository,
      bindingsRepository,
      sourceReader,
      hasher,
      secretGenerator,
      datetimeProvider,
    })
  }
  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  handle(
    @Body(new ZodValidationPipe(verifySignatureOtpSchema)) body: VerifyOtpBody,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Headers('X-HMS-Signing-CSRF') csrfToken: string,
  ) {
    return this.useCase
      .execute({
        flowToken: this.getGatewayCookie(request, FLOW_COOKIE),
        deviceToken: this.getGatewayCookie(request, DEVICE_COOKIE),
        csrfToken: this.requireGatewayValue(csrfToken, 'csrf'),
        challengeId: body.challengeId,
        code: body.code,
        sourceIpHash: this.hashGatewayFingerprint(request.ip ?? ''),
      })
      .then((session) => {
        this.setGatewayCookie(
          response,
          FLOW_COOKIE,
          session.authenticatedToken,
          session.expiresAt,
        )
        this.setGatewayCookie(
          response,
          DEVICE_COOKIE,
          session.deviceToken,
          session.expiresAt,
        )
        return this.contextUseCase
          .execute({
            sessionToken: session.authenticatedToken,
            deviceToken: session.deviceToken,
          })
          .then((result) => {
            response.setHeader(
              'X-HMS-Signing-CSRF',
              this.requireGatewayValue(result.csrfToken, 'csrf'),
            )
            return result
          })
      })
  }
}
