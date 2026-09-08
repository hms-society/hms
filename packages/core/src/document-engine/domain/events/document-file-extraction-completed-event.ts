import type { DocumentFileMetadata } from '../structures'
import { Event } from '../../../shared/domain/events'

type Payload = {
  batchId: string
  documentFileId: string
  metadata: DocumentFileMetadata
}

export class DocumentFileExtractionCompletedEvent extends Event<Payload> {
  static readonly _NAME = 'document-engine/document-file.extraction-completed'

  constructor(payload: Payload) {
    super(DocumentFileExtractionCompletedEvent._NAME, payload)
  }
}
