export const ConsultationChannel = {
  WhatsappVideo: 'whatsapp_video',
  GoogleMeet: 'google_meet',
  Teams: 'teams',
  InPerson: 'in_person',
  Other: 'other',
} as const

export type ConsultationChannel =
  (typeof ConsultationChannel)[keyof typeof ConsultationChannel]
