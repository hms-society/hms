import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { auditLogModel } from '@/identity/database/drizzle/models/audit-model'
import { DrizzleAuditLogsRepository } from '@/shared/database/drizzle/repositories'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { SharedDatabaseModule } from '@/shared/database/drizzle/database.module'
import { RestFixture } from '@/shared/rest/tests/rest-fixture'

describe('DrizzleAuditLogsRepository', () => {
  let fixture: RestFixture
  let repository: DrizzleAuditLogsRepository
  let drizzle: DrizzleClient

  beforeAll(async () => {
    fixture = await RestFixture.register({ imports: [SharedDatabaseModule] })
    repository = fixture.get(DrizzleAuditLogsRepository)
    drizzle = fixture.get(DrizzleClient)
  })

  beforeEach(async () => {
    await fixture.resetDatabase()
  })

  afterAll(async () => {
    await fixture?.close()
  })

  it('loads global audit events, parses JSON and returns newest first', async () => {
    const actorId = randomUUID()
    const entityId = randomUUID()
    const olderId = randomUUID()
    const newerId = randomUUID()
    const database = drizzle.requireDatabase()

    await database.insert(auditLogModel).values([
      {
        id: olderId,
        idUsuario: actorId,
        perfilUsuario: 'admin',
        entidade: 'third_party',
        idEntidade: entityId,
        campoAlterado: 'created',
        valorAnterior: null,
        valorNovo: JSON.stringify({ name: 'Old' }),
        timestamp: new Date('2026-10-06T10:00:00.000Z'),
      },
      {
        id: newerId,
        idUsuario: actorId,
        perfilUsuario: 'admin',
        entidade: 'third_party',
        idEntidade: entityId,
        campoAlterado: 'updated',
        valorAnterior: JSON.stringify({ name: 'Old' }),
        valorNovo: JSON.stringify({ name: 'New' }),
        timestamp: new Date('2026-10-06T11:00:00.000Z'),
      },
    ])

    const result = await repository.list({
      page: 1,
      limit: 10,
      entityType: 'third_party',
    })

    expect(result.total).toBe(2)
    expect(result.data.map((event) => event.id)).toEqual([newerId, olderId])
    expect(result.data[0]).toMatchObject({
      actorId,
      actorProfile: 'admin',
      action: 'updated',
      beforeData: { name: 'Old' },
      afterData: { name: 'New' },
    })
  })

  it('applies action, actor and pagination filters', async () => {
    const actorId = randomUUID()
    const entityId = randomUUID()
    const database = drizzle.requireDatabase()

    await database.insert(auditLogModel).values([
      {
        idUsuario: actorId,
        perfilUsuario: 'supervisor',
        entidade: 'third_party',
        idEntidade: entityId,
        campoAlterado: 'permission_granted',
        timestamp: new Date('2026-10-06T10:00:00.000Z'),
      },
      {
        idUsuario: randomUUID(),
        perfilUsuario: 'admin',
        entidade: 'third_party',
        idEntidade: entityId,
        campoAlterado: 'permission_revoked',
        timestamp: new Date('2026-10-06T11:00:00.000Z'),
      },
    ])

    const result = await repository.list({
      page: 1,
      limit: 1,
      actorId,
      action: 'permission_granted',
    })

    expect(result.total).toBe(1)
    expect(result.data).toHaveLength(1)
    expect(result.data[0]?.action).toBe('permission_granted')
  })

  it('finds a global audit event by id', async () => {
    const id = randomUUID()
    const database = drizzle.requireDatabase()
    await database.insert(auditLogModel).values({
      id,
      idUsuario: randomUUID(),
      perfilUsuario: 'admin',
      entidade: 'document',
      idEntidade: randomUUID(),
      campoAlterado: 'validated',
    })

    await expect(repository.findById(id)).resolves.toMatchObject({
      id,
      entityType: 'document',
      action: 'validated',
    })
  })
})
