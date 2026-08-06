import { Inject, Injectable } from '@nestjs/common'
import type { Client, ClientCreation } from '@hms/core/identity/domain/entities'
import type { ClientsRepository } from '@hms/core/identity/interfaces'

import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'
import { clientModel } from '@/identity/database/drizzle/models'
import { DrizzleClientMapper } from '@/identity/database/drizzle/mappers'
import { intakeModel } from '@/intake/database'
import { type SQL, and, desc, eq, or, ilike, sql } from 'drizzle-orm'

@Injectable()
export class DrizzleClientsRepository
  extends DrizzleRepository
  implements ClientsRepository
{
  constructor(
    drizzle: DrizzleClient,
    @Inject(DrizzleClientMapper) private readonly clientMapper: DrizzleClientMapper,
  ) {
    super(drizzle)
  }

  async add(client: ClientCreation): Promise<Client | undefined> {
    const [createdClient] = await this.database
      .insert(clientModel)
      .values(this.toDrizzle(client))
      .onConflictDoNothing()
      .returning()

    return createdClient ? this.clientMapper.toDomain(createdClient) : undefined
  }

  async addMany(clients: ClientCreation[]): Promise<Client[]> {
    if (clients.length === 0) return []

    const createdClients = await this.database
      .insert(clientModel)
      .values(clients.map((client) => this.toDrizzle(client)))
      .returning()

    return createdClients.map((client) => this.clientMapper.toDomain(client))
  }

  async removeAll(): Promise<void> {
    await this.database.delete(clientModel)
  }

  async findById(clientId: string): Promise<Client | undefined> {
    const [client] = await this.database
      .select()
      .from(clientModel)
      .where(eq(clientModel.id, clientId))
      .limit(1)

    return client ? this.clientMapper.toDomain(client) : undefined
  }

  async findByTaxId(taxId: Client['taxId']): Promise<Client | undefined> {
    const [client] = await this.database
      .select()
      .from(clientModel)
      .where(
        and(
          eq(clientModel.taxIdType, taxId.type),
          eq(clientModel.taxIdValue, taxId.value),
        ),
      )
      .limit(1)

    return client ? this.clientMapper.toDomain(client) : undefined
  }

  async findByPhone(phone: string): Promise<Client[]> {
    const clients = await this.database
      .select()
      .from(clientModel)
      .where(eq(clientModel.phone, phone))
      .orderBy(desc(clientModel.createdAt))

    return clients.map((client) => this.clientMapper.toDomain(client))
  }

  async findAll({
    page,
    limit,
    search,
  }: {
    page: number
    limit: number
    search?: string
  }) {
    const offset = (Math.max(page, 1) - 1) * limit

    let whereClause: SQL | undefined

    if (search) {
      const searchPattern = `%${search}%`
      whereClause = or(
        ilike(clientModel.name, searchPattern),
        ilike(clientModel.legalName, searchPattern),
        ilike(clientModel.tradeName, searchPattern),
        ilike(clientModel.taxIdValue, searchPattern),
        ilike(clientModel.phone, searchPattern),
      )
    }

    const records = await this.database
      .select({
        client: clientModel,
        intakeCount: sql<number>`count(${intakeModel.id})::int`,
        latestOrigin: sql<string>`(array_agg(${intakeModel.origin} ORDER BY ${intakeModel.createdAt} DESC))[1]`,
      })
      .from(clientModel)
      .leftJoin(intakeModel, eq(clientModel.id, intakeModel.clientId))
      .where(whereClause)
      .groupBy(clientModel.id)
      .orderBy(desc(clientModel.createdAt))
      .limit(limit)
      .offset(offset)

    const [totalCountResult] = await this.database
      .select({ count: sql<number>`count(${clientModel.id})::int` })
      .from(clientModel)
      .where(whereClause)

    return {
      data: records.map((record) => ({
        client: this.clientMapper.toDomain(record.client),
        intakeCount: record.intakeCount,
        latestOrigin: record.latestOrigin,
      })),
      total: totalCountResult?.count ?? 0,
    }
  }

  private toDrizzle(client: ClientCreation) {
    return {
      id: (client as any).id ?? undefined,
      type: client.type,
      name: client.type === 'natural' ? client.name : null,
      legalName: client.type === 'legal' ? client.legalName : null,
      tradeName: client.type === 'legal' ? (client.tradeName ?? null) : null,
      taxIdType: client.taxId.type,
      taxIdValue: client.taxId.value,
      phone: client.phone ?? null,
      email: client.email ?? null,
      street: client.address?.street ?? null,
      number: client.address?.number ?? null,
      complement: client.address?.complement ?? null,
      district: client.address?.district ?? null,
      city: client.address?.city ?? null,
      state: client.address?.state ?? null,
      zipCode: client.address?.zipCode ?? null,
    }
  }
}
