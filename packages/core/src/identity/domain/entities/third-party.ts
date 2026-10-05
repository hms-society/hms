import type { Entity } from '#shared/domain/entities/entity'

import type {
  TaxId,
  ThirdPartyRelationshipType,
  ThirdPartyStatus,
  ThirdPartyType,
} from '../structures'

export type ThirdParty = Entity & {
  type: ThirdPartyType
  legalName: string
  tradeName?: string
  taxId: TaxId<'cnpj' | 'official_registration' | 'other_national_document'>
  internalResponsibleId: string
  relationshipTypes: ThirdPartyRelationshipType[]
  status: ThirdPartyStatus
  createdAt: Date
  updatedAt: Date
}
