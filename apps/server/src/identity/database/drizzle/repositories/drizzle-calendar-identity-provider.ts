import { Inject, Injectable } from '@nestjs/common'
import type { CollaboratorsRepository } from '@hms/core/identity/interfaces'
import type { CalendarIdentityProvider } from '@hms/core/shared/interfaces'
import { and, asc, eq, gt, ilike, inArray, or } from 'drizzle-orm'

import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import {
  clientModel,
  collaboratorModel,
  userModel,
} from '@/identity/database/drizzle/models'
import { DatabaseTransactionContext } from '@/shared/database/drizzle/database-transaction-context'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'

@Injectable()
export class DrizzleCalendarIdentityProvider implements CalendarIdentityProvider {
  constructor(
    private readonly drizzleClient: DrizzleClient,
    @Inject(IDENTITY_REPOSITORIES.collaborators)
    private readonly collaboratorsRepository: CollaboratorsRepository,
    private readonly transactionContext: DatabaseTransactionContext,
  ) {}

  async getActor(id: string) {
    const collaborator = await this.collaboratorsRepository.findSummaryById(id)
    return collaborator?.status === 'active' ? collaborator : undefined
  }

  async getClients(ids: readonly string[]) {
    if (ids.length === 0) return new Map()
    const rows = await this.drizzleClient
      .requireDatabase()
      .select({
        id: clientModel.id,
        name: clientModel.name,
        legalName: clientModel.legalName,
        tradeName: clientModel.tradeName,
      })
      .from(clientModel)
      .where(inArray(clientModel.id, [...ids]))

    return new Map(
      rows.flatMap((row) => {
        const name = row.name ?? row.tradeName ?? row.legalName
        return name ? [[row.id, { name }] as const] : []
      }),
    )
  }

  async getLawyers(ids: readonly string[]) {
    if (ids.length === 0) return new Map()
    const transaction = this.transactionContext.get()
    const executor = transaction ?? this.drizzleClient.requireDatabase()
    const query = executor
      .select({
        id: collaboratorModel.id,
        name: collaboratorModel.professionalName,
        status: userModel.status,
      })
      .from(collaboratorModel)
      .innerJoin(userModel, eq(userModel.id, collaboratorModel.userId))
      .where(
        and(
          eq(collaboratorModel.profile, 'lawyer'),
          inArray(collaboratorModel.id, [...ids]),
        ),
      )
    const rows = transaction ? await query.for('update', { of: userModel }) : await query

    return new Map(
      rows.map((row) => [row.id, { name: row.name, active: row.status === 'active' }]),
    )
  }

  async getCollaborators(ids: readonly string[]) {
    if (ids.length === 0) return new Map()
    const rows = await this.drizzleClient
      .requireDatabase()
      .select({ id: collaboratorModel.id, name: collaboratorModel.professionalName })
      .from(collaboratorModel)
      .where(inArray(collaboratorModel.id, [...ids]))
    return new Map(rows.map((row) => [row.id, { name: row.name }]))
  }

  async searchClients(search: string, cursor: string | undefined, limit: number) {
    const conditions = [
      or(
        ilike(clientModel.name, `%${search}%`),
        ilike(clientModel.legalName, `%${search}%`),
        ilike(clientModel.tradeName, `%${search}%`),
      ),
      ...(cursor ? [gt(clientModel.id, cursor)] : []),
    ]
    const rows = await this.drizzleClient
      .requireDatabase()
      .select({
        id: clientModel.id,
        name: clientModel.name,
        legalName: clientModel.legalName,
        tradeName: clientModel.tradeName,
      })
      .from(clientModel)
      .where(and(...conditions))
      .orderBy(asc(clientModel.id))
      .limit(limit)

    const items = rows.flatMap((row) => {
      const name = row.name ?? row.tradeName ?? row.legalName
      return name ? [{ id: row.id, name }] : []
    })
    return {
      items,
      nextCursor: rows.length === limit ? rows[rows.length - 1].id : undefined,
    }
  }

  async searchLawyers(search: string, cursor: string | undefined, limit: number) {
    const conditions = [
      eq(collaboratorModel.profile, 'lawyer'),
      ilike(collaboratorModel.professionalName, `%${search}%`),
      ...(cursor ? [gt(collaboratorModel.id, cursor)] : []),
    ]
    const rows = await this.drizzleClient
      .requireDatabase()
      .select({ id: collaboratorModel.id, name: collaboratorModel.professionalName })
      .from(collaboratorModel)
      .where(and(...conditions))
      .orderBy(asc(collaboratorModel.id))
      .limit(limit)

    return {
      items: rows.map((row) => ({ id: row.id, name: row.name })),
      nextCursor: rows.length === limit ? rows[rows.length - 1].id : undefined,
    }
  }
}
