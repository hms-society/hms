import { Injectable } from '@nestjs/common'
import { EnvProvider } from '../provision/env/env-provider'
import type {
  WhatsappProvider as IWhatsappProvider,
  SendWhatsappMessageParams,
  SendWhatsappMessageResult,
} from '@hms/core/communication/interfaces'

const MAX_MEDIA_SIZE_BYTES = 50 * 1024 * 1024 // 50MB

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

  async downloadMedia(
    mediaId: string,
  ): Promise<{ buffer: Uint8Array; mimeType: string }> {
    const token = this.envProvider.get('WHATSAPP_API_TOKEN')

    const metadataUrl = `https://graph.facebook.com/v25.0/${mediaId}`
    const metadataResponse = await fetch(metadataUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!metadataResponse.ok) {
      const errorText = await metadataResponse.text()
      throw new Error(
        `Failed to fetch WhatsApp media metadata: ${metadataResponse.status} - ${errorText}`,
      )
    }

    const metadata = (await metadataResponse.json()) as {
      url?: string
      mime_type?: string
      file_size?: number
    }

    if (!metadata.url) {
      throw new Error('Meta Cloud API response did not contain a media URL')
    }

    if (metadata.file_size && metadata.file_size > MAX_MEDIA_SIZE_BYTES) {
      throw new Error(
        `WhatsApp media size (${metadata.file_size} bytes) exceeds maximum allowed limit of 50MB`,
      )
    }

    const downloadResponse = await fetch(metadata.url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!downloadResponse.ok) {
      const errorText = await downloadResponse.text()
      throw new Error(
        `Failed to download WhatsApp media bytes: ${downloadResponse.status} - ${errorText}`,
      )
    }

    const contentLengthHeader = downloadResponse.headers?.get?.('content-length')
    if (contentLengthHeader) {
      const contentLength = Number.parseInt(contentLengthHeader, 10)
      if (!Number.isNaN(contentLength) && contentLength > MAX_MEDIA_SIZE_BYTES) {
        throw new Error(
          `WhatsApp media content-length (${contentLength} bytes) exceeds maximum allowed limit of 50MB`,
        )
      }
    }

    const reader = downloadResponse.body?.getReader?.()
    if (reader) {
      const chunks: Uint8Array[] = []
      let totalBytes = 0

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          if (value) {
            totalBytes += value.byteLength
            if (totalBytes > MAX_MEDIA_SIZE_BYTES) {
              await reader.cancel()
              throw new Error(
                'WhatsApp media stream size exceeds maximum allowed limit of 50MB',
              )
            }
            chunks.push(value)
          }
        }
      } catch (err) {
        if (err instanceof Error && err.message.includes('exceeds maximum')) {
          throw err
        }
        throw new Error(`Failed during WhatsApp media stream reading: ${err}`)
      }

      const buffer = new Uint8Array(totalBytes)
      let offset = 0
      for (const chunk of chunks) {
        buffer.set(chunk, offset)
        offset += chunk.byteLength
      }

      return {
        buffer,
        mimeType: metadata.mime_type ?? 'application/octet-stream',
      }
    }

    const arrayBuffer = await downloadResponse.arrayBuffer()
    if (arrayBuffer.byteLength > MAX_MEDIA_SIZE_BYTES) {
      throw new Error(
        `WhatsApp media size (${arrayBuffer.byteLength} bytes) exceeds maximum allowed limit of 50MB`,
      )
    }

    return {
      buffer: new Uint8Array(arrayBuffer),
      mimeType: metadata.mime_type ?? 'application/octet-stream',
    }
  }
}
