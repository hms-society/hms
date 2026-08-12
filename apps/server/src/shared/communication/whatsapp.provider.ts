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
      console.log(errorText)
      try {
        const errorJson = JSON.parse(errorText)
        const metaError = errorJson?.error
        if (metaError) {
          throw new Error(`Meta API [Erro ${metaError.code}]: ${metaError.message}`)
        }
      } catch (e: any) {
        if (e.message?.startsWith('Meta API')) throw e
      }
      throw new Error(
        `Failed to send WhatsApp message: ${response.status} - ${errorText}`,
      )
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

  async sendTextMessage(phone: string, text: string): Promise<SendWhatsappMessageResult> {
    const token = this.envProvider.get('WHATSAPP_API_TOKEN')
    const phoneNumberId = this.envProvider.get('WHATSAPP_PHONE_NUMBER_ID')

    if (!token) throw new Error('Token not found')
    if (!phoneNumberId) throw new Error('Phone number id not found')

    const url = `https://graph.facebook.com/v25.0/${phoneNumberId}/messages`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phone,
        type: 'text',
        text: {
          body: text,
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      try {
        const errorJson = JSON.parse(errorText)
        const metaError = errorJson?.error
        if (metaError) {
          throw new Error(`Meta API [Erro ${metaError.code}]: ${metaError.message}`)
        }
      } catch (e: any) {
        if (e.message?.startsWith('Meta API')) throw e
      }
      throw new Error(
        `Failed to send WhatsApp text message: ${response.status} - ${errorText}`,
      )
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

  async downloadMedia(
    mediaId: string,
  ): Promise<{ buffer: Buffer; mimeType: string; size: number }> {
    const token = this.envProvider.get('WHATSAPP_API_TOKEN')
    if (!token) throw new Error('WHATSAPP_API_TOKEN not found')

    const metaUrl = `https://graph.facebook.com/v25.0/${mediaId}`
    const metaRes = await fetch(metaUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!metaRes.ok) {
      const errorText = await metaRes.text()
      throw new Error(
        `Failed to fetch WhatsApp media metadata: ${metaRes.status} - ${errorText}`,
      )
    }

    const mediaInfo = (await metaRes.json()) as {
      url: string
      mime_type: string
      file_size: number
    }

    const downloadRes = await fetch(mediaInfo.url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!downloadRes.ok) {
      throw new Error(`Failed to download WhatsApp media binary: ${downloadRes.status}`)
    }

    const arrayBuffer = await downloadRes.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    return {
      buffer,
      mimeType: mediaInfo.mime_type,
      size: mediaInfo.file_size || buffer.length,
    }
  }
}
