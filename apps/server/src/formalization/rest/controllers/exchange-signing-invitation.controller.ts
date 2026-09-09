import { SigningGatewayController } from '@/formalization/rest/controllers/signing-gateway.controller'
import { Body, HttpCode, HttpStatus, Inject, Post, Req, Res } from '@nestjs/common'
import { createZodDto, ZodValidationPipe } from 'nestjs-zod'
import type { Request, Response } from 'express'
import { exchangeSignatureInvitationSchema } from '@hms/validation/formalization'
import { ExchangeSignatureInvitationUseCase } from '@hms/core/formalization/use-cases'
import type {
  FormalizationSignatureInvitationsRepository,
  FormalizationSignatureGatewaySessionsRepository,
  FormalizationSignatureRequestsRepository,
  FormalizationSignatureRecipientsRepository,
  FormalizationSignatureGatewayTransaction,
  SignatureSecretHasher,
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
import { EnvProvider } from '@/shared/provision/env/env-provider'
import { FLOW_COOKIE, DEVICE_COOKIE } from './signing-gateway.controller'

class ExchangeInvitationBody extends createZodDto(exchangeSignatureInvitationSchema) {}

@SigningGatewayRoute()
export class ExchangeSigningInvitationController extends SigningGatewayController {
  private readonly useCase: ExchangeSignatureInvitationUseCase
  constructor(
    @Inject(FORMALIZATION_REPOSITORIES.signatureInvitations)
    invitationsRepository: FormalizationSignatureInvitationsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureGatewaySessions)
    sessionsRepository: FormalizationSignatureGatewaySessionsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureRequests)
    requestsRepository: FormalizationSignatureRequestsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureRecipients)
    recipientsRepository: FormalizationSignatureRecipientsRepository,
    @Inject(FORMALIZATION_DATABASE_OPERATIONS.signatureGatewayTransaction)
    transaction: FormalizationSignatureGatewayTransaction,
    @Inject(FORMALIZATION_PROVIDERS.signatureSecretGenerator) secretGenerator: {
      generate(): string
    },
    @Inject(EnvProvider) private readonly env: EnvProvider,
    @Inject(ServerIdProvider) idProvider: IdProvider,
    @Inject(ServerDatetimeProvider) datetimeProvider: DatetimeProvider,
    @Inject(FORMALIZATION_PROVIDERS.signatureSecretHasher) hasher: SignatureSecretHasher,
  ) {
    super()
    this.useCase = new ExchangeSignatureInvitationUseCase({
      invitationsRepository,
      sessionsRepository,
      requestsRepository,
      recipientsRepository,
      transaction,
      idProvider,
      secretGenerator,
      datetimeProvider,
      hasher,
    })
  }
  @Post('invitations/exchange')
  @HttpCode(HttpStatus.OK)
  handle(
    @Body(new ZodValidationPipe(exchangeSignatureInvitationSchema))
    body: ExchangeInvitationBody,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.useCase
      .execute({
        token: body.token,
        origin: this.getGatewayOrigin(request, this.env),
        sourceIpHash: this.hashGatewayFingerprint(request.ip ?? ''),
        userAgentHash: this.hashGatewayFingerprint(request.get('user-agent') ?? ''),
      })
      .then((session) => {
        this.setGatewayCookie(response, FLOW_COOKIE, session.flowToken, session.expiresAt)
        this.setGatewayCookie(
          response,
          DEVICE_COOKIE,
          session.deviceToken,
          session.expiresAt,
        )
        response.setHeader('X-HMS-Signing-CSRF', session.csrfToken)
        return { step: 'invitation' as const, csrfToken: session.csrfToken }
      })
  }
}
