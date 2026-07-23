import type { Event } from '../domain/events'

export interface Broker {
  publish(event: Event): void
}
