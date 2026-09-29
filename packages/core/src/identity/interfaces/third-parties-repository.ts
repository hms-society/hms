import type { ThirdParty, ThirdPartyCreation } from '../domain/entities'
import type { TaxId } from '../domain/structures'
import type { ThirdPartyStatus } from '../domain/structures'

export interface ThirdPartiesRepository {
  add(thirdParty: ThirdPartyCreation): Promise<ThirdParty | undefined>
  findById(thirdPartyId: string): Promise<ThirdParty | undefined>
  findAll(): Promise<ThirdParty[]>
  updateStatus(
    thirdPartyId: string,
    status: ThirdPartyStatus,
  ): Promise<ThirdParty | undefined>
  findByTaxId(
    taxId: TaxId<'cnpj' | 'official_registration' | 'other_national_document'>,
  ): Promise<ThirdParty | undefined>
}
