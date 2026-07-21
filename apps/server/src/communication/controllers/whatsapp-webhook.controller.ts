import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common'

import { EvolutionWebhookGuard } from '../guards/evolution-webhook.guard'
import { WhatsAppWebhookService } from '../services/whatsapp-webhook.service'

@Controller('integrations/whatsapp')
export class WhatsAppWebhookController {
  constructor(private readonly whatsappWebhookService: WhatsAppWebhookService) {}

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @UseGuards(EvolutionWebhookGuard)
  async handleWebhook(@Body() payload: Record<string, any>) {
    const result = await this.whatsappWebhookService.processWebhook(payload)
    return {
      success: true,
      data: result,
    }
  }
}
