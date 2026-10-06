import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { IdentityModuleFixture } from '@/identity/fixtures/identity-module-fixture'
import { ListCollaboratorJobTitlesController } from '@/identity/rest/controllers/list-collaborator-job-titles.controller'

describe('List Collaborator Job Titles Controller [GET /collaborators/job-titles]', () => {
  let fixture: IdentityModuleFixture
  beforeAll(async () => {
    fixture = await IdentityModuleFixture.register(ListCollaboratorJobTitlesController)
  })
  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture?.close())

  it('lists distinct titles for an administrator', async () => {
    const { user: admin } = await fixture.registerAdmin({ jobTitle: 'Administrador' })
    const user = await fixture.registerUser()
    await fixture.registerCollaborator(user, {
      jobTitle: 'Atendente',
      profile: 'attendant',
    })
    const response = await request(fixture.app.getHttpServer())
      .get('/collaborators/job-titles')
      .set('Authorization', fixture.authenticateAs(admin))
      .expect(200)
    expect(response.body).toEqual(expect.arrayContaining(['Administrador', 'Atendente']))
  })

  it('rejects a non-administrator', async () => {
    const user = await fixture.registerUser()
    await fixture.registerCollaborator(user, { profile: 'attendant' })
    await request(fixture.app.getHttpServer())
      .get('/collaborators/job-titles')
      .set('Authorization', fixture.authenticateAs(user))
      .expect(403)
  })
})
