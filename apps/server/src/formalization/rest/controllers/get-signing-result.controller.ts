import { SigningGatewayController } from '@/formalization/rest/controllers/signing-gateway.controller'
import { Get, Inject, Req } from '@nestjs/common'
import type { Request } from 'express'
import { GetSignatureResultUseCase } from '@hms/core/formalization/use-cases'
import type {
  FormalizationSignatureGatewaySessionsRepository,
  FormalizationSignatureRequestsRepository,
  FormalizationSignatureRecipientsRepository,
  FormalizationSignatureProtocolsRepository,
  SignatureSecretHasher,
} from '@hms/core/formalization/interfaces'
import type { DatetimeProvider } from '@hms/core/shared/interfaces'
import { SigningGatewayController as SigningGatewayRoute } from '@/formalization/decorators'
import { FORMALIZATION_REPOSITORIES } from '@/formalization/constants/formalization-repositories'
import { FORMALIZATION_PROVIDERS } from '@/formalization/constants/formalization-providers'
import { DatetimeProvider as ServerDatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import {
  FLOW_COOKIE,
  DEVICE_COOKIE,
} from '@/formalization/rest/controllers/signing-gateway.controller'
@SigningGatewayRoute()
export class GetSigningResultController extends SigningGatewayController {
  private readonly useCase: GetSignatureResultUseCase
  constructor(
    @Inject(FORMALIZATION_REPOSITORIES.signatureGatewaySessions)
    sessionsRepository: FormalizationSignatureGatewaySessionsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureRequests)
    requestsRepository: FormalizationSignatureRequestsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureRecipients)
    recipientsRepository: FormalizationSignatureRecipientsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureProtocols)
    protocolsRepository: FormalizationSignatureProtocolsRepository,
    @Inject(ServerDatetimeProvider) datetimeProvider: DatetimeProvider,
    @Inject(FORMALIZATION_PROVIDERS.signatureSecretHasher) hasher: SignatureSecretHasher,
  ) {
    super()
    this.useCase = new GetSignatureResultUseCase({
      sessionsRepository,
      requestsRepository,
      recipientsRepository,
      protocolsRepository,
      datetimeProvider,
      hash: (value) => hasher.hash(value),
    })
  }
  @Get('result')
  handle(@Req() request: Request) {
    return this.useCase.execute({
      sessionToken: this.getGatewayCookie(request, FLOW_COOKIE),
      deviceToken: this.getGatewayCookie(request, DEVICE_COOKIE),
    })
  }
}
