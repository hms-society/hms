import type { CommunicationChannel } from './communication-channel'

export type WhatsappContactEndpoint = {
  readonly channel: typeof CommunicationChannel.Whatsapp
  readonly address: string
}

export type EmailContactEndpoint = {
  readonly channel: typeof CommunicationChannel.Email
  readonly address: string
}

export type ContactEndpoint = WhatsappContactEndpoint | EmailContactEndpoint
