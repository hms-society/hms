export const DocumentChannel = {
  Whatsapp: 'whatsapp',
  ClientPortal: 'client_portal',
  ThirdPartyPortal: 'third_party_portal',
  InternalUpload: 'internal_upload',
} as const

export type DocumentChannel = typeof DocumentChannel[keyof typeof DocumentChannel]