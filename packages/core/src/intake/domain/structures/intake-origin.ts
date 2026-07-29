export const IntakeOrigin = {
  Direct: 'direct',
  Referral: 'referral',
  Website: 'website',
  SocialMedia: 'social_media',
  Other: 'other',
} as const

export type IntakeOrigin = (typeof IntakeOrigin)[keyof typeof IntakeOrigin]
