export const IntakeOrigin = {
  DirectHms: 'direct_hms',
  ThirdParty: 'third_party',
  Return: 'return',
  Referral: 'referral',
  Campaign: 'campaign',
  Other: 'other',
} as const

export type IntakeOrigin = (typeof IntakeOrigin)[keyof typeof IntakeOrigin]
