import { SigningGatewayController } from '@/formalization/rest/controllers/signing-gateway.controller'
import { Get, Inject, Req } from '@nestjs/common'
import type { Request } from 'express'
import { ListSignatureAuthenticationChannelsUseCase } from '@hms/core/formalization/use-cases'
import type {
  FormalizationSignatureGatewaySessionsRepository,
  FormalizationSignatureSourceReader,
  SignatureSecretHasher,
} from '@hms/core/formalization/interfaces'
import { SigningGatewayController as SigningGatewayRoute } from '@/formalization/decorators'
import { FORMALIZATION_REPOSITORIES } from '@/formalization/constants/formalization-repositories'
import { FORMALIZATION_PROVIDERS } from '@/formalization/constants/formalization-providers'
import { FLOW_COOKIE, DEVICE_COOKIE } from './signing-gateway.controller'

@SigningGatewayRoute()
export class ListSigningAuthenticationChannelsController extends SigningGatewayController {
  private readonly useCase: ListSignatureAuthenticationChannelsUseCase
  constructor(
    @Inject(FORMALIZATION_REPOSITORIES.signatureGatewaySessions)
    sessionsRepository: FormalizationSignatureGatewaySessionsRepository,
    @Inject(FORMALIZATION_PROVIDERS.signatureSourceReader)
    sourceReader: FormalizationSignatureSourceReader,
    @Inject(FORMALIZATION_PROVIDERS.signatureSecretHasher) hasher: SignatureSecretHasher,
  ) {
    super()
    this.useCase = new ListSignatureAuthenticationChannelsUseCase({
      sessionsRepository,
      sourceReader,
      hasher,
    })
  }
  @Get('channels')
  handle(@Req() request: Request) {
    return this.useCase.execute({
      flowToken: this.getGatewayCookie(request, FLOW_COOKIE),
      deviceToken: this.getGatewayCookie(request, DEVICE_COOKIE),
    })
  }
}
