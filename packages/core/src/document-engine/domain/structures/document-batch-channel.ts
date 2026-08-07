export const DocumentBatchChannel = {
  WhatsApp: 'whatsapp',
  Email: 'email',
  ClientPortal: 'client_portal',
  ThirdPartyPortal: 'third_party_portal',
  InternalUpload: 'internal_upload',
} as const

export type DocumentBatchChannel =
  (typeof DocumentBatchChannel)[keyof typeof DocumentBatchChannel]