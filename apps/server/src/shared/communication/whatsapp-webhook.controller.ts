import {
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  ForbiddenException,
  Logger,
  type RawBodyRequest,
} from '@nestjs/common'
import type { Request, Response } from 'express'
import { createHmac, timingSafeEqual } from 'node:crypto'

import { EnvProvider } from '@/shared/provision/env/env-provider'
import { InngestService } from '@/shared/provision/inngest/inngest.service'

@Controller('integrations/whatsapp/webhook')
export class WhatsappWebhookController {
  private readonly logger = new Logger(WhatsappWebhookController.name)

  constructor(
    private readonly envProvider: EnvProvider,
    private readonly inngestService: InngestService,
  ) {}

  @Get()
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.challenge') challenge: string,
    @Query('hub.verify_token') verifyToken: string,
    @Res() res: Response,
  ) {
    const configuredVerifyToken = this.envProvider.get('WHATSAPP_WEBHOOK_VERIFY_TOKEN')

    if (
      configuredVerifyToken &&
      mode === 'subscribe' &&
      verifyToken === configuredVerifyToken
    ) {
      this.logger.log('Webhook verified successfully')
      return res.status(HttpStatus.OK).type('text/plain').send(challenge)
    }

    this.logger.warn('Failed webhook verification attempt')
    throw new ForbiddenException('Verification token mismatch')
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Req() req: RawBodyRequest<Request>) {
    this.logger.log('Incoming webhook request received')

    const signatureHeader = req.headers['x-hub-signature-256']
    const signature = Array.isArray(signatureHeader)
      ? signatureHeader[0]
      : signatureHeader
    if (!signature?.startsWith('sha256=')) {
      this.logger.warn('Webhook request missing x-hub-signature-256 header')
      throw new ForbiddenException('Missing signature')
    }

    if (!req.rawBody) {
      this.logger.error(
        'rawBody is undefined. Make sure NestFactory.create has { rawBody: true }',
      )
      throw new ForbiddenException('Unable to verify raw payload')
    }

    const appSecret = this.envProvider.get('WHATSAPP_APP_SECRET')
    if (!appSecret) {
      this.logger.error('WHATSAPP_APP_SECRET is not configured')
      throw new ForbiddenException('Webhook signature validation is not configured')
    }

    const signatureHash = signature.slice('sha256='.length)
    if (!/^[a-f0-9]{64}$/i.test(signatureHash)) {
      this.logger.warn('Webhook request signature has an invalid format')
      throw new ForbiddenException('Invalid signature')
    }

    const expectedHash = createHmac('sha256', appSecret).update(req.rawBody).digest('hex')

    const signatureBuffer = Buffer.from(signatureHash, 'hex')
    const expectedBuffer = Buffer.from(expectedHash, 'hex')

    if (
      signatureBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(signatureBuffer, expectedBuffer)
    ) {
      this.logger.warn('Webhook request signature mismatch')
      throw new ForbiddenException('Invalid signature')
    }

    const payload = req.body
    this.logger.log(`Received valid WhatsApp webhook payload: ${JSON.stringify(payload)}`)

    try {
      await this.inngestService.client.send({
        name: 'whatsapp/event.received',
        data: payload,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.logger.error(`Failed to dispatch event to Inngest: ${message}`)
    }

    return { status: 'success' }
  }
}
