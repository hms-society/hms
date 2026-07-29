import type { SendEmailMessageParams } from './send-email-message-params'
import type { SendEmailMessageResult } from './send-email-message-result'

export interface EmailProvider {
  sendMessage(params: SendEmailMessageParams): Promise<SendEmailMessageResult>
}
