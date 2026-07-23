import type { DocumentBatchChannel } from './document-batch-channel'

type WhatsAppDocumentBatchSender = {
  channel: typeof DocumentBatchChannel.WhatsApp
  phone: string
  externalReference?: string
}

type EmailDocumentBatchSender = {
  channel: typeof DocumentBatchChannel.Email
  email: string
  externalReference?: string
}

export type DocumentBatchSender = WhatsAppDocumentBatchSender | EmailDocumentBatchSender
