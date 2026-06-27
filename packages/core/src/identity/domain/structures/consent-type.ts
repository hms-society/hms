export const ConsentType = {
  LgpdPersonalData: 'lgpd_personal_data',
  CommunicationWhatsapp: 'communication_whatsapp',
  CommunicationEmail: 'communication_email',
  ThirdPartySharing: 'third_party_sharing',
} as const

export type ConsentType = (typeof ConsentType)[keyof typeof ConsentType]
