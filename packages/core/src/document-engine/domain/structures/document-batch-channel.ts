export const DocumentBatchChannel = {
  WhatsApp: 'whatsapp',
  Email: 'email',
} as const

export type DocumentBatchChannel =
  (typeof DocumentBatchChannel)[keyof typeof DocumentBatchChannel]
