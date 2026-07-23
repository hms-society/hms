import type { SaveEventToOutboxParams } from './save-event-to-outbox-params'

export interface EventOutbox {
  save(params: SaveEventToOutboxParams): Promise<void>
}
