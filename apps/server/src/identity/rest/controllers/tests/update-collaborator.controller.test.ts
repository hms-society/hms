import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { IdentityModuleFixture } from '@/identity/fixtures/identity-module-fixture'
import { UpdateCollaboratorController } from '@/identity/rest/controllers/update-collaborator.controller'
import { DrizzleCollaboratorsRepository } from '@/identity/database/drizzle/repositories'

describe('Update Collaborator Controller [PATCH /collaborators/:collaboratorId]', () => {
  let fixture: IdentityModuleFixture
  beforeAll(async () => {
    fixture = await IdentityModuleFixture.register(UpdateCollaboratorController)
  })
  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture?.close())

  it('updates a collaborator and persists the change', async () => {
    const { user: admin } = await fixture.registerAdmin()
    const user = await fixture.registerUser()
    const collaborator = await fixture.registerCollaborator(user, {
      profile: 'attendant',
    })
    const response = await request(fixture.app.getHttpServer())
      .patch(`/collaborators/${collaborator.id}`)
      .set('Authorization', fixture.authenticateAs(admin))
      .send({
        professionalName: 'Ana Ribeiro',
        jobTitle: 'Coordenadora',
        profile: 'attendant',
      })
      .expect(200)
    expect(response.body).toMatchObject({
      collaboratorId: collaborator.id,
      professionalName: 'Ana Ribeiro',
      jobTitle: 'Coordenadora',
    })
    expect(
      await fixture.app.get(DrizzleCollaboratorsRepository).findById(collaborator.id),
    ).toMatchObject({ professionalName: 'Ana Ribeiro', jobTitle: 'Coordenadora' })
  })

  it('returns not found for an unknown collaborator', async () => {
    const { user: admin } = await fixture.registerAdmin()
    await request(fixture.app.getHttpServer())
      .patch(`/collaborators/${randomUUID()}`)
      .set('Authorization', fixture.authenticateAs(admin))
      .send({ professionalName: 'Ana Ribeiro', profile: 'attendant' })
      .expect(404)
  })
})
