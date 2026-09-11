import { Event } from '../../../shared/domain/events'

type Payload = {
  batchId: string
  documentFileId: string
  storagePath: string
  originalName: string
  mimeType: string
  sizeBytes: number
  hashSha256: string
  extractedTextFull?: string
}

export class DocumentFileJsonOrganizationRequestedEvent extends Event<Payload> {
  static readonly _NAME = 'document-engine/document-file.json-organization-requested'

  constructor(payload: Payload) {
    super(DocumentFileJsonOrganizationRequestedEvent._NAME, payload)
  }
}
