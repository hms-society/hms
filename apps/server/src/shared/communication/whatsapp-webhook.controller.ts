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
} from '@nestjs/common'
import type { Request, Response } from 'express'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { EnvProvider } from '../provision/env/env-provider'

@Controller('integrations/whatsapp/webhook')
export class WhatsappWebhookController {
  private readonly logger = new Logger(WhatsappWebhookController.name)

  constructor(private readonly envProvider: EnvProvider) {}

  @Get()
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.challenge') challenge: string,
    @Query('hub.verify_token') verifyToken: string,
    @Res() res: Response,
  ) {
    const configuredVerifyToken = this.envProvider.get('WHATSAPP_WEBHOOK_VERIFY_TOKEN')

    if (mode === 'subscribe' && verifyToken === configuredVerifyToken) {
      this.logger.log('Webhook verified successfully')
      return res.status(HttpStatus.OK).type('text/plain').send(challenge)
    }

    this.logger.warn('Failed webhook verification attempt')
    throw new ForbiddenException('Verification token mismatch')
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  handleWebhook(@Req() req: Request) {
    this.logger.log('Incoming webhook request received')
    this.logger.log(`Headers: ${JSON.stringify(req.headers)}`)
    this.logger.log(`Body: ${JSON.stringify(req.body)}`)

    const signature = req.headers['x-hub-signature-256'] as string
    if (!signature) {
      this.logger.warn('Webhook request missing x-hub-signature-256 header')
      throw new ForbiddenException('Missing signature')
    }

    const rawBody = (req as any).rawBody
    if (!rawBody) {
      this.logger.error('rawBody is undefined. Make sure NestFactory.create has { rawBody: true }')
      throw new ForbiddenException('Unable to verify raw payload')
    }

    const appSecret = this.envProvider.get('WHATSAPP_APP_SECRET')
    const signatureHash = signature.replace('sha256=', '')

    const expectedHash = createHmac('sha256', appSecret).update(rawBody).digest('hex')

    const signatureBuffer = Buffer.from(signatureHash, 'hex')
    const expectedBuffer = Buffer.from(expectedHash, 'hex')

    if (
      signatureBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(signatureBuffer, expectedBuffer)
    ) {
      this.logger.warn('Webhook request signature mismatch')
      throw new ForbiddenException('Invalid signature')
    }

    // Payload is valid
    const payload = req.body
    this.logger.log(`Received valid WhatsApp webhook payload: ${JSON.stringify(payload)}`)

    // TODO: Process payload and dispatch to Inngest / Core modules
    return { status: 'success' }
  }
}
