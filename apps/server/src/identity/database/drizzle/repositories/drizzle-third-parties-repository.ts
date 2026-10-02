import { Injectable } from '@nestjs/common'
import type { ThirdParty, ThirdPartyCreation } from '@hms/core/identity/domain/entities'
import type { TaxId, ThirdPartyStatus } from '@hms/core/identity/domain/structures'
import type { ThirdPartiesRepository } from '@hms/core/identity/interfaces'

import { thirdPartyModel } from '@/identity/database/drizzle/models'
import { DrizzleThirdPartyMapper } from '@/identity/database/drizzle/mappers'
import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { and, desc, eq } from 'drizzle-orm'

@Injectable()
export class DrizzleThirdPartiesRepository
  extends DrizzleRepository
  implements ThirdPartiesRepository
{
  constructor(
    drizzle: DrizzleClient,
    private readonly thirdPartyMapper: DrizzleThirdPartyMapper,
  ) {
    super(drizzle)
  }

  async add(thirdParty: ThirdPartyCreation): Promise<ThirdParty | undefined> {
    const [createdThirdParty] = await this.database
      .insert(thirdPartyModel)
      .values(this.toDrizzle(thirdParty))
      .onConflictDoNothing()
      .returning()

    return createdThirdParty
      ? this.thirdPartyMapper.toDomain(createdThirdParty)
      : undefined
  }

  async findById(thirdPartyId: string): Promise<ThirdParty | undefined> {
    const [thirdParty] = await this.database
      .select()
      .from(thirdPartyModel)
      .where(eq(thirdPartyModel.id, thirdPartyId))
      .limit(1)

    return thirdParty ? this.thirdPartyMapper.toDomain(thirdParty) : undefined
  }

  async findAll(): Promise<ThirdParty[]> {
    const thirdParties = await this.database
      .select()
      .from(thirdPartyModel)
      .orderBy(desc(thirdPartyModel.createdAt))

    return thirdParties.map((thirdParty) => this.thirdPartyMapper.toDomain(thirdParty))
  }

  async update(
    thirdPartyId: string,
    changes: Partial<ThirdPartyCreation>,
  ): Promise<ThirdParty | undefined> {
    const [updatedThirdParty] = await this.database
      .update(thirdPartyModel)
      .set({
        ...(changes.type ? { type: changes.type } : {}),
        ...(changes.legalName ? { legalName: changes.legalName } : {}),
        ...(changes.tradeName !== undefined
          ? { tradeName: changes.tradeName ?? null }
          : {}),
        ...(changes.taxId
          ? {
              taxIdType: changes.taxId.type,
              taxIdValue: changes.taxId.value,
              taxIdDescription: changes.taxId.description ?? null,
            }
          : {}),
        ...(changes.internalResponsibleId
          ? { internalResponsibleId: changes.internalResponsibleId }
          : {}),
        ...(changes.relationshipTypes
          ? { relationshipTypes: changes.relationshipTypes }
          : {}),
        updatedAt: new Date(),
      })
      .where(eq(thirdPartyModel.id, thirdPartyId))
      .returning()

    return updatedThirdParty
      ? this.thirdPartyMapper.toDomain(updatedThirdParty)
      : undefined
  }

  async updateStatus(
    thirdPartyId: string,
    status: ThirdPartyStatus,
  ): Promise<ThirdParty | undefined> {
    const [updatedThirdParty] = await this.database
      .update(thirdPartyModel)
      .set({ status, updatedAt: new Date() })
      .where(eq(thirdPartyModel.id, thirdPartyId))
      .returning()

    return updatedThirdParty
      ? this.thirdPartyMapper.toDomain(updatedThirdParty)
      : undefined
  }

  async findByTaxId(
    taxId: TaxId<'cnpj' | 'official_registration' | 'other_national_document'>,
  ): Promise<ThirdParty | undefined> {
    const [thirdParty] = await this.database
      .select()
      .from(thirdPartyModel)
      .where(
        and(
          eq(thirdPartyModel.taxIdType, taxId.type),
          eq(thirdPartyModel.taxIdValue, taxId.value),
        ),
      )
      .limit(1)

    return thirdParty ? this.thirdPartyMapper.toDomain(thirdParty) : undefined
  }

  private toDrizzle(thirdParty: ThirdPartyCreation) {
    return {
      type: thirdParty.type,
      legalName: thirdParty.legalName,
      tradeName: thirdParty.tradeName ?? null,
      taxIdType: thirdParty.taxId.type,
      taxIdValue: thirdParty.taxId.value,
      taxIdDescription: thirdParty.taxId.description ?? null,
      internalResponsibleId: thirdParty.internalResponsibleId,
      relationshipTypes: thirdParty.relationshipTypes,
    }
  }
}
