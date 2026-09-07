import type { SendWhatsappMessageParams } from './send-whatsapp-message-params'
import type { SendWhatsappMessageResult } from './send-whatsapp-message-result'

export interface WhatsappProvider {
  sendAutomaticMessage(
    params: SendWhatsappMessageParams,
  ): Promise<SendWhatsappMessageResult>
  downloadMedia(mediaId: string): Promise<{ buffer: Uint8Array; mimeType: string }>
}
