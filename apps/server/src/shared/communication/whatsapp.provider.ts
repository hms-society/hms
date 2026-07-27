import { Injectable } from '@nestjs/common'
import { EnvProvider } from '../provision/env/env-provider'
import type {
  WhatsappProvider as IWhatsappProvider,
  SendWhatsappMessageParams,
  SendWhatsappMessageResult,
} from '@hms/core/communication/interfaces'

@Injectable()
export class WhatsappProvider implements IWhatsappProvider {
  constructor(private readonly envProvider: EnvProvider) {}

  async sendAutomaticMessage(
    params: SendWhatsappMessageParams,
  ): Promise<SendWhatsappMessageResult> {
    const token = this.envProvider.get('WHATSAPP_API_TOKEN')
    const phoneNumberId = this.envProvider.get('WHATSAPP_PHONE_NUMBER_ID')
    const mode = this.envProvider.get('HMS_SERVER_APP_MODE')

    const url = `https://graph.facebook.com/v25.0/${phoneNumberId}/messages`

    let templateName = 'hello_world'
    let languageCode = 'en_US'

    if (mode === 'prod' || mode === 'staging') {
      if (params.kind === 'appointment_scheduled') {
        templateName = 'appointment_scheduled'
        languageCode = 'pt_BR'
      } else if (params.kind === 'appointment_rescheduled') {
        templateName = 'appointment_rescheduled'
        languageCode = 'pt_BR'
      }
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: params.phone,
        type: 'template',
        template: {
          name: templateName,
          language: {
            code: languageCode,
          },
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to send WhatsApp message: ${response.status} - ${errorText}`)
    }

    const responseData = (await response.json()) as {
      messages?: Array<{ id: string }>
    }

    const externalMessageId = responseData.messages?.[0]?.id

    if (!externalMessageId) {
      throw new Error('Meta Cloud API response did not contain a message ID')
    }

    return {
      externalMessageId,
    }
  }
}
