import { Controller, Get } from '@nestjs/common'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { RouteAccess } from '@/identity/decorators/route-access.decorator'
import { IdentityModuleFixture } from '@/identity/fixtures/identity-module-fixture'

@Controller('access-probe')
class AccessProbeController {
  @Get('internal')
  internal() { return { allowed: true } }

  @RouteAccess('public')
  @Get('public')
  public() { return { allowed: true } }
}

describe('Application Access Guard', () => {
  let fixture: IdentityModuleFixture
  beforeAll(async () => {
    fixture = await IdentityModuleFixture.register(AccessProbeController, true)
  })
  beforeEach(async () => {
    fixture.clearAuthentication()
    await fixture.resetDatabase()
  })
  afterAll(async () => fixture?.close())

  it('denies unannotated internal routes to anonymous requests', async () => {
    await request(fixture.app.getHttpServer()).get('/access-probe/internal').expect(401)
  })

  it('allows explicitly public routes without a user session', async () => {
    const response = await request(fixture.app.getHttpServer()).get('/access-probe/public').expect(200)
    expect(response.body).toEqual({ allowed: true })
  })

  it('preserves active collaborator access', async () => {
    const { user } = await fixture.registerAdmin()
    await request(fixture.app.getHttpServer())
      .get('/access-probe/internal')
      .set('Authorization', fixture.authenticateAs(user))
      .expect(200)
  })

  it('denies legacy client collaborators and inactive collaborators', async () => {
    const user = await fixture.registerUser()
    await fixture.registerCollaborator(user, { profile: 'client' })
    await request(fixture.app.getHttpServer()).get('/access-probe/internal').set('Authorization', fixture.authenticateAs(user)).expect(403)
    const inactiveUser = await fixture.registerUser({ status: 'disabled' })
    await fixture.registerCollaborator(inactiveUser)
    await request(fixture.app.getHttpServer()).get('/access-probe/internal').set('Authorization', fixture.authenticateAs(inactiveUser)).expect(401)
  })
})
