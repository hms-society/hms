export const ContactChannel = {
  Whatsapp: 'whatsapp',
  InPerson: 'in_person',
  Phone: 'phone',
  Email: 'email',
  Portal: 'portal',
  Other: 'other',
} as const

export type ContactChannel = (typeof ContactChannel)[keyof typeof ContactChannel]
