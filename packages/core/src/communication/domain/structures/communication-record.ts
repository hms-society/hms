export type CommunicationRecord = {
  id: string
  channel: 'whatsapp' | 'email' | 'phone'
  direction: 'inbound' | 'outbound'
  content: string
  createdAt: string
  author: string
  externalId?: string
}
