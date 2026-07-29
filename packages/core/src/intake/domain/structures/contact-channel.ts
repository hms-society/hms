export const ContactChannel = {
  Whatsapp: 'whatsapp',
  Email: 'email',
  Phone: 'phone',
  InPerson: 'in_person',
} as const

export type ContactChannel = (typeof ContactChannel)[keyof typeof ContactChannel]
