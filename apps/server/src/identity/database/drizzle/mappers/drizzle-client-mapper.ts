import type { Client } from '@hms/core/identity/domain/entities'

import type { DrizzleClient } from '@/identity/database/drizzle/types/entities'

export class DrizzleClientMapper {
  toDomain(drizzleClient: DrizzleClient): Client {
    const address = this.toAddress(drizzleClient)
    const common = {
      id: drizzleClient.id,
      email: drizzleClient.email ?? undefined,
      phone: drizzleClient.phone ?? undefined,
      address,
      createdAt: drizzleClient.createdAt,
      updatedAt: drizzleClient.updatedAt,
    }

    if (drizzleClient.type === 'natural') {
      if (!drizzleClient.name || drizzleClient.taxIdType !== 'cpf') {
        throw new Error('Invalid natural client record')
      }

      return {
        ...common,
        type: 'natural',
        name: drizzleClient.name,
        taxId: { type: 'cpf', value: drizzleClient.taxIdValue },
      }
    }

    if (!drizzleClient.legalName || drizzleClient.taxIdType !== 'cnpj') {
      throw new Error('Invalid legal client record')
    }

    return {
      ...common,
      type: 'legal',
      legalName: drizzleClient.legalName,
      tradeName: drizzleClient.tradeName ?? undefined,
      taxId: { type: 'cnpj', value: drizzleClient.taxIdValue },
    }
  }

  private toAddress(drizzleClient: DrizzleClient) {
    const values = [
      drizzleClient.street,
      drizzleClient.number,
      drizzleClient.district,
      drizzleClient.city,
      drizzleClient.state,
      drizzleClient.zipCode,
    ]

    if (values.some((value) => value === null)) return undefined

    return {
      street: drizzleClient.street as string,
      number: drizzleClient.number as string,
      complement: drizzleClient.complement ?? undefined,
      district: drizzleClient.district as string,
      city: drizzleClient.city as string,
      state: drizzleClient.state as string,
      zipCode: drizzleClient.zipCode as string,
    }
  }
}
