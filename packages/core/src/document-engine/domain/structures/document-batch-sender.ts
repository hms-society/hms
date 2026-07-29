import type { DocumentBatchChannel } from './document-batch-channel'

type WhatsAppDocumentBatchSender = {
  readonly channel: typeof DocumentBatchChannel.WhatsApp
  readonly phone: string
  readonly externalReference?: string
}

type EmailDocumentBatchSender = {
  readonly channel: typeof DocumentBatchChannel.Email
  readonly email: string
  readonly externalReference?: string
}

export type DocumentBatchSender = WhatsAppDocumentBatchSender | EmailDocumentBatchSender
