import { randomUUID } from 'node:crypto'
import type { ExecutionContext } from '@nestjs/common'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { auditLogModel } from '@/identity/database/drizzle/models/audit-model'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { SharedRestModule } from '@/shared/rest/rest.module'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { RestFixture } from '@/shared/rest/tests/rest-fixture'

describe('Audit logs HTTP endpoints', () => {
  let fixture: RestFixture | undefined
  let drizzle: DrizzleClient
  let profile: 'admin' | 'supervisor' | 'lawyer' = 'admin'

  beforeAll(async () => {
    fixture = await RestFixture.register({ imports: [SharedRestModule] }, (builder) =>
      builder
        .overrideGuard(AuthGuard)
        .useValue({
          canActivate(context: ExecutionContext) {
            const request = context.switchToHttp().getRequest<Record<string, unknown>>()
            request.auth = { accessToken: 'fixture-token' }
            request.user = { id: 'user-1' }
            return true
          },
        })
        .overrideGuard(ActiveCollaboratorGuard)
        .useValue({
          canActivate(context: ExecutionContext) {
            const request = context.switchToHttp().getRequest<Record<string, unknown>>()
            request.collaborator = { profile }
            return true
          },
        }),
    )
    drizzle = fixture.get(DrizzleClient)
  })

  beforeEach(async () => {
    await fixture?.resetDatabase()
    profile = 'admin'
  })

  afterAll(async () => {
    await fixture?.close()
  })

  it('lists audit logs with query filters', async () => {
    const idEntidade = randomUUID()
    await drizzle.requireDatabase().insert(auditLogModel).values({
      idUsuario: randomUUID(),
      perfilUsuario: 'admin',
      entidade: 'third_party',
      idEntidade,
      campoAlterado: 'permission_granted',
    })

    await request(fixture?.app.getHttpServer())
      .get('/audit-logs?entityType=third_party&action=permission_granted')
      .expect(200)
      .expect(({ body }) => {
        expect(body.total).toBe(1)
        expect(body.page).toBe(1)
        expect(body.limit).toBe(20)
        expect(body.data[0]).toMatchObject({
          entityType: 'third_party',
          action: 'permission_granted',
        })
      })
  })

  it('returns audit log details by id', async () => {
    const id = randomUUID()
    await drizzle
      .requireDatabase()
      .insert(auditLogModel)
      .values({
        id,
        idUsuario: randomUUID(),
        perfilUsuario: 'admin',
        entidade: 'case',
        idEntidade: randomUUID(),
        campoAlterado: 'updated',
        valorNovo: JSON.stringify({ status: 'closed' }),
      })

    await request(fixture?.app.getHttpServer())
      .get(`/audit-logs/${id}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({ id, entityType: 'case', action: 'updated' })
        expect(body.afterData).toEqual({ status: 'closed' })
      })
  })

  it('blocks collaborators outside the administrative profiles', async () => {
    profile = 'lawyer'

    await request(fixture?.app.getHttpServer()).get('/audit-logs').expect(403)
  })
})
