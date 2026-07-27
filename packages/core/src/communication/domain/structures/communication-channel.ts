export const CommunicationChannel = {
  Whatsapp: 'whatsapp',
  Email: 'email',
} as const

export type CommunicationChannel =
  (typeof CommunicationChannel)[keyof typeof CommunicationChannel]
