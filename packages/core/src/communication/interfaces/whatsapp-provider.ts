import type { SendWhatsappMessageParams } from './send-whatsapp-message-params'
import type { SendWhatsappMessageResult } from './send-whatsapp-message-result'

export interface WhatsappProvider {
  sendAutomaticMessage(
    params: SendWhatsappMessageParams,
  ): Promise<SendWhatsappMessageResult>
  sendTextMessage?(phone: string, text: string): Promise<SendWhatsappMessageResult>
}
