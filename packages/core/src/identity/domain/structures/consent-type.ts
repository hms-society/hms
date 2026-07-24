export const ConsentType = {
  DataProcessing: 'data_processing',
  WhatsappCommunication: 'whatsapp_communication',
  EmailCommunication: 'email_communication',
  ThirdPartySharing: 'third_party_sharing',
} as const

export type ConsentType = (typeof ConsentType)[keyof typeof ConsentType]
