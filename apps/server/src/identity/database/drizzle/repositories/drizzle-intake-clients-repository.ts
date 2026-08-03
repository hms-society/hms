import { Inject, Injectable, Optional } from '@nestjs/common'
import type { ClientListProjection } from '@hms/core/identity/domain/structures'
import type { IntakeClientsRepository } from '@hms/core/identity/interfaces'
import { asc, ilike, inArray } from 'drizzle-orm'

import { clientModel } from '@/identity/database/drizzle/models'
import {
  DrizzleIdentityRepository,
  type IdentityDatabaseExecutor,
} from '@/identity/database/drizzle/repositories/drizzle-identity-repository'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'

@Injectable()
export class DrizzleIntakeClientsRepository
  extends DrizzleIdentityRepository
  implements IntakeClientsRepository
{
  constructor(
    @Inject(DrizzleClient) drizzle: DrizzleClient,
    @Optional()
    databaseOverride?: IdentityDatabaseExecutor,
  ) {
    super(drizzle, databaseOverride)
  }

  async findClientIdsBySearch(search: string): Promise<readonly string[]> {
    const normalizedSearch = search.trim()

    if (!normalizedSearch) return []

    const namePattern = `%${this.escapeLikePattern(normalizedSearch)}%`
    const clients = await this.database
      .select({ clientId: clientModel.id })
      .from(clientModel)
      .where(ilike(clientModel.name, namePattern))
      .orderBy(asc(clientModel.id))

    return clients.map(({ clientId }) => clientId)
  }

  async findClientsByIds(
    clientIds: readonly string[],
  ): Promise<readonly ClientListProjection[]> {
    if (clientIds.length === 0) return []

    const clients = await this.database
      .select({
        clientId: clientModel.id,
        name: clientModel.name,
        legalName: clientModel.legalName,
        tradeName: clientModel.tradeName,
        taxIdType: clientModel.taxIdType,
        taxIdValue: clientModel.taxIdValue,
      })
      .from(clientModel)
      .where(inArray(clientModel.id, clientIds))
      .orderBy(asc(clientModel.id))

    return clients.map((client) => ({
      clientId: client.clientId,
      name: client.name ?? client.legalName ?? client.tradeName ?? '',
      maskedTaxId: this.maskTaxId(client.taxIdType, client.taxIdValue),
    }))
  }

  private escapeLikePattern(value: string) {
    return value.replace(/[\\%_]/g, '\\$&')
  }

  private maskTaxId(type: 'cpf' | 'cnpj', value: string) {
    const digits = value.replace(/\D/g, '')

    if (type === 'cpf') {
      return `***.***.***-${digits.slice(-2)}`
    }

    return `**.***.***/****-${digits.slice(-2)}`
  }
}
