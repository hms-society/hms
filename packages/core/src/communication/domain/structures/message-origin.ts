export const MessageOrigin = {
  Client: 'client',
  Attendant: 'attendant',
  Automation: 'automation',
} as const

export type MessageOrigin = (typeof MessageOrigin)[keyof typeof MessageOrigin]
