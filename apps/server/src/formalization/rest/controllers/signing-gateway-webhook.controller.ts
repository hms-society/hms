import {
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common'
import { timingSafeEqual } from 'node:crypto'
import type { Request } from 'express'
import { documensoWebhookSchema } from '@hms/validation/formalization'

import { FormalizationSigningGatewayService } from '@/formalization/formalization-signature-sending.service'
import { EnvProvider } from '@/shared/provision/env/env-provider'
import {
  DocumensoWebhookNormalizer,
  UnprocessableDocumensoWebhookError,
} from '@/formalization/provision'

@Controller('formalizations/signing-gateway/webhooks/documenso')
export class SigningGatewayWebhookController {
  constructor(
    private readonly service: FormalizationSigningGatewayService,
    private readonly env: EnvProvider,
    private readonly normalizer: DocumensoWebhookNormalizer,
  ) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async handle(
    @Req() request: Request,
    @Headers('X-Documenso-Secret') secret: string | undefined,
    @Headers('X-Documenso-Event-Id') providerEventId: string | undefined,
    @Headers('X-Documenso-Event') eventType: string | undefined,
  ) {
    const configured = this.env.get('DOCUMENSO_WEBHOOK_SECRET')
    if (!configured || !secret || !this.safeEqual(configured, secret)) {
      throw new UnauthorizedException('Invalid provider webhook secret.')
    }
    const parsed = documensoWebhookSchema.safeParse(request.body)
    if (!parsed.success || !eventType || !providerEventId) {
      throw new BadRequestException('Invalid Documenso webhook.')
    }
    if (providerEventId !== parsed.data.id) {
      throw new BadRequestException('Invalid Documenso webhook event id.')
    }
    try {
      const normalized = await this.normalizer.normalize({
        eventName: eventType,
        webhook: parsed.data,
        receivedAt: new Date(),
      })
      await this.service.receiveWebhookPayload(normalized)
    } catch (error) {
      if (!(error instanceof UnprocessableDocumensoWebhookError)) throw error
    }
    return { accepted: true }
  }

  private safeEqual(expected: string, actual: string) {
    const expectedBytes = Buffer.from(expected)
    const actualBytes = Buffer.from(actual)
    return (
      expectedBytes.length === actualBytes.length &&
      timingSafeEqual(expectedBytes, actualBytes)
    )
  }
}
