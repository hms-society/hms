export const MessageDirection = {
  Incoming: 'incoming',
  Outgoing: 'outgoing',
} as const

export type MessageDirection = (typeof MessageDirection)[keyof typeof MessageDirection]
