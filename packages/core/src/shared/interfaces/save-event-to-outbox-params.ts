import type { Event } from '../domain/events'

export type SaveEventToOutboxParams = {
  event: Event
  idempotencyKey: string
}
