import type { CommunicationChannel } from './communication-channel'

export type WhatsappContactEndpoint = {
  channel: typeof CommunicationChannel.Whatsapp
  address: string
}

export type EmailContactEndpoint = {
  channel: typeof CommunicationChannel.Email
  address: string
}

export type ContactEndpoint = WhatsappContactEndpoint | EmailContactEndpoint
