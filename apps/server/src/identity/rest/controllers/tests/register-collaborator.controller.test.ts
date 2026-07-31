import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { IdentityModuleFixture } from '@/identity/fixtures/identity-module-fixture'
import {
  DrizzleCollaboratorsRepository,
  DrizzleUsersRepository,
} from '@/identity/database/drizzle/repositories'
import { RegisterCollaboratorController } from '@/identity/rest/controllers/register-collaborator.controller'

describe('Register Collaborator Controller [POST /collaborators]', () => {
  let fixture: IdentityModuleFixture

  beforeAll(async () => {
    fixture = await IdentityModuleFixture.register(RegisterCollaboratorController)
  })

  beforeEach(async () => fixture.resetDatabase())

  afterAll(async () => fixture.close())

  it('invites and persists a collaborator once', async () => {
    const { user: administrator } = await fixture.registerAdmin()

    const response = await request(fixture.app.getHttpServer())
      .post('/collaborators')
      .set('Authorization', fixture.authenticateAs(administrator))
      .send({
        email: `new-${administrator.id}@example.com`,
        professionalName: 'Novo colaborador',
        jobTitle: 'Atendente',
        profile: 'attendant',
      })
      .expect(201)

    expect(response.body).toMatchObject({
      professionalName: 'Novo colaborador',
      profile: 'attendant',
      status: 'invited',
    })

    const usersRepository = fixture.app.get(DrizzleUsersRepository)
    const collaboratorsRepository = fixture.app.get(DrizzleCollaboratorsRepository)
    const user = await usersRepository.findByEmail(response.body.email)
    const collaborator = user
      ? await collaboratorsRepository.findByUserId(user.id)
      : undefined

    expect(user?.status).toBe('invited')
    expect(collaborator?.id).toBe(response.body.collaboratorId)
  })

  it('rejects an invalid payload before inviting', async () => {
    const { user: administrator } = await fixture.registerAdmin()

    await request(fixture.app.getHttpServer())
      .post('/collaborators')
      .set('Authorization', fixture.authenticateAs(administrator))
      .send({
        email: 'not-an-email',
        professionalName: '',
        profile: 'attendant',
      })
      .expect(400)
  })

  it('rejects a signed-in non-administrator', async () => {
    const attendant = await fixture.registerUser()
    await fixture.registerCollaborator(attendant, { profile: 'attendant' })

    await request(fixture.app.getHttpServer())
      .post('/collaborators')
      .set('Authorization', fixture.authenticateAs(attendant))
      .send({
        email: `not-authorized-${attendant.id}@example.com`,
        professionalName: 'Não autorizado',
        profile: 'attendant',
      })
      .expect(403)
  })
})
