import { Event } from '#shared/domain/events/event'

export class WhatsappDocumentBatchReceivedEvent extends Event<{
  eventoId: string
  sender: string
  clientId: string
  mimeType: string
  originalName: string
}> {
  static readonly _NAME = 'documents/whatsapp.batch.received'

  constructor(payload: WhatsappDocumentBatchReceivedEvent['payload']) {
    super(WhatsappDocumentBatchReceivedEvent._NAME, payload)
  }
}
