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
import { DatabaseService } from '../database/database.service'
import { integracaoEvento } from '../database/schema/integracao-evento'
import { InngestService } from '../provision/inngest/inngest.service'

@Controller('integrations/whatsapp/webhook')
export class WhatsappWebhookController {
  private readonly logger = new Logger(WhatsappWebhookController.name)

  constructor(
    private readonly envProvider: EnvProvider,
    private readonly databaseService: DatabaseService,
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
    console.log(configuredVerifyToken)

    if (mode === 'subscribe' && verifyToken === configuredVerifyToken) {
      this.logger.log('Webhook verified successfully')
      return res.status(HttpStatus.OK).type('text/plain').send(challenge)
    }

    this.logger.warn('Failed webhook verification attempt')
    throw new ForbiddenException('Verification token mismatch')
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Req() req: Request) {
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

    const payload = req.body
    this.logger.log(`Received valid WhatsApp webhook payload: ${JSON.stringify(payload)}`)

    if (this.databaseService.db) {
      try {
        await this.databaseService.db.insert(integracaoEvento).values({
          provedor: 'whatsapp',
          payload,
          status: 'sucesso',
        })
      } catch (err: any) {
        this.logger.error(`Failed to store webhook event: ${err.message}`)
        try {
          await this.databaseService.db.insert(integracaoEvento).values({
            provedor: 'whatsapp',
            payload,
            status: 'falha_transitoria',
            erro: err.message || String(err),
          })
        } catch (_innerErr) {
          this.logger.error('Failed to log failure event to database')
        }
      }
    } else {
      this.logger.error('Database client is not initialized in DatabaseService')
    }

    // Dispatch to Inngest
    try {
      await this.inngestService.client.send({
        name: 'whatsapp/event.received',
        data: payload,
      })
    } catch (inngestErr: any) {
      this.logger.error(`Failed to dispatch event to Inngest: ${inngestErr.message}`)
    }

    return { status: 'success' }
  }
}
