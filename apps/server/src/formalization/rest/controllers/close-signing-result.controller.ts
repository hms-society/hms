import { SigningGatewayController } from '@/formalization/rest/controllers/signing-gateway.controller'
import { Delete, Headers, HttpCode, HttpStatus, Inject, Req, Res } from '@nestjs/common'
import type { Request, Response } from 'express'
import { CloseSignatureResultUseCase } from '@hms/core/formalization/use-cases'
import type {
  FormalizationSignatureGatewaySessionsRepository,
  SignatureSecretHasher,
} from '@hms/core/formalization/interfaces'
import { SigningGatewayController as SigningGatewayRoute } from '@/formalization/decorators'
import { FORMALIZATION_REPOSITORIES } from '@/formalization/constants/formalization-repositories'
import { FORMALIZATION_PROVIDERS } from '@/formalization/constants/formalization-providers'
import {
  FLOW_COOKIE,
  DEVICE_COOKIE,
} from '@/formalization/rest/controllers/signing-gateway.controller'
@SigningGatewayRoute()
export class CloseSigningResultController extends SigningGatewayController {
  private readonly useCase: CloseSignatureResultUseCase
  constructor(
    @Inject(FORMALIZATION_REPOSITORIES.signatureGatewaySessions)
    sessionsRepository: FormalizationSignatureGatewaySessionsRepository,
    @Inject(FORMALIZATION_PROVIDERS.signatureSecretHasher) hasher: SignatureSecretHasher,
  ) {
    super()
    this.useCase = new CloseSignatureResultUseCase({
      sessionsRepository,
      hash: (value) => hasher.hash(value),
    })
  }
  @Delete('result')
  @HttpCode(HttpStatus.NO_CONTENT)
  handle(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Headers('X-HMS-Signing-CSRF') csrfToken: string,
  ) {
    return this.useCase
      .execute({
        sessionToken: this.getGatewayCookie(request, FLOW_COOKIE),
        deviceToken: this.getGatewayCookie(request, DEVICE_COOKIE),
        csrfToken: this.requireGatewayValue(csrfToken, 'csrf'),
      })
      .then(() => {
        response.setHeader(
          'Set-Cookie',
          `${FLOW_COOKIE}=; Max-Age=0; Path=/formalizations/signing-gateway; HttpOnly; SameSite=Lax`,
        )
      })
  }
}
