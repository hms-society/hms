export const ThirdPartyRelationshipType = {
  DemandOrigin: 'demand_origin',
  Payer: 'payer',
  RepresentativePartner: 'representative_partner',
  DocumentSupporter: 'document_supporter',
  Contractor: 'contractor',
  Other: 'other',
} as const

export type ThirdPartyRelationshipType =
  (typeof ThirdPartyRelationshipType)[keyof typeof ThirdPartyRelationshipType]
