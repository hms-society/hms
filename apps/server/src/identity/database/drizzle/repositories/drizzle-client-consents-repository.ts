import { Inject, Injectable } from '@nestjs/common'
import type {
  ClientConsent,
  ClientConsentCreation,
} from '@hms/core/identity/domain/entities'
import type { ClientConsentsRepository } from '@hms/core/identity/interfaces'
import { and, asc, eq, isNull } from 'drizzle-orm'

import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'
import { clientConsentModel } from '@/identity/database/drizzle/models'
import { DrizzleClientConsentMapper } from '@/identity/database/drizzle/mappers'

@Injectable()
export class DrizzleClientConsentsRepository
  extends DrizzleRepository
  implements ClientConsentsRepository
{
  constructor(
    drizzle: DrizzleClient,
    @Inject(DrizzleClientConsentMapper)
    private readonly consentMapper: DrizzleClientConsentMapper,
  ) {
    super(drizzle)
  }

  async addMany(consents: ClientConsentCreation[]): Promise<ClientConsent[]> {
    if (consents.length === 0) return []

    const createdConsents = await this.database
      .insert(clientConsentModel)
      .values(consents)
      .returning()

    return createdConsents.map((consent) => this.consentMapper.toDomain(consent))
  }

  async add(consent: ClientConsentCreation): Promise<ClientConsent | undefined> {
    const [createdConsent] = await this.database
      .insert(clientConsentModel)
      .values(consent)
      .onConflictDoNothing()
      .returning()

    return createdConsent ? this.consentMapper.toDomain(createdConsent) : undefined
  }

  async findActiveByClientIdAndType(
    clientId: string,
    type: ClientConsent['type'],
  ): Promise<ClientConsent | undefined> {
    const [consent] = await this.database
      .select()
      .from(clientConsentModel)
      .where(
        and(
          eq(clientConsentModel.clientId, clientId),
          eq(clientConsentModel.type, type),
          isNull(clientConsentModel.revokedAt),
        ),
      )
      .limit(1)
    return consent ? this.consentMapper.toDomain(consent) : undefined
  }

  async findByClientId(clientId: string): Promise<ClientConsent[]> {
    const consents = await this.database
      .select()
      .from(clientConsentModel)
      .where(
        and(
          eq(clientConsentModel.clientId, clientId),
          isNull(clientConsentModel.revokedAt),
        ),
      )
      .orderBy(asc(clientConsentModel.type))

    return consents.map((consent) => this.consentMapper.toDomain(consent))
  }
}
