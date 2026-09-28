import type { ThirdParty, ThirdPartyCreation } from '../domain/entities'
import type { TaxId } from '../domain/structures'

export interface ThirdPartiesRepository {
  add(thirdParty: ThirdPartyCreation): Promise<ThirdParty | undefined>
  findByTaxId(
    taxId: TaxId<'cnpj' | 'official_registration' | 'other_national_document'>,
  ): Promise<ThirdParty | undefined>
}
