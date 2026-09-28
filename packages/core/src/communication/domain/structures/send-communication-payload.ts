export type SendCommunicationPayload = {
  clientId: string
  content: string
  channel: 'whatsapp' | 'email' | 'phone'
  type?: 'text' | 'template'
  templateName?: string
}
