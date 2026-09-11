import { Event } from '../../../shared/domain/events'

type Payload = {
  batchId: string
  documentFileId: string
  storagePath: string
  originalName: string
  mimeType: string
  sizeBytes: number
}

export class DocumentFileProcessingRequestedEvent extends Event<Payload> {
  static readonly _NAME = 'document-engine/document-file.processing-requested'

  constructor(payload: Payload) {
    super(DocumentFileProcessingRequestedEvent._NAME, payload)
  }
}
