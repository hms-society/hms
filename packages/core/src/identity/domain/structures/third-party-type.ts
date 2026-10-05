export const ThirdPartyType = {
  Union: 'union',
  Association: 'association',
  PartnerCompany: 'partner_company',
  InstitutionalPartner: 'institutional_partner',
  Other: 'other',
} as const

export type ThirdPartyType = (typeof ThirdPartyType)[keyof typeof ThirdPartyType]
