import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { CommunicationRestModuleFixture } from '@/communication/fixtures/communication-rest-module-fixture'

describe('Register Waba Account Controller [POST /communication/waba/embedded-signup/exchange]', () => {
  let fixture: CommunicationRestModuleFixture
  beforeAll(async () => {
    fixture = await CommunicationRestModuleFixture.register()
  }, 90_000)
  beforeEach(async () => fixture.resetDatabase(), 30_000)
  afterAll(async () => fixture?.close(), 30_000)

  it('exchanges a code with the local Meta protocol and stores a channel', async () => {
    const admin = await fixture.createAdminSession()
    const response = await request(fixture.app.getHttpServer())
      .post('/communication/waba/embedded-signup/exchange')
      .set('Authorization', admin.token)
      .send({
        lawyerId: admin.userId,
        code: 'local-code',
        wabaId: 'waba-local',
        phoneNumberId: 'phone-local',
      })
      .expect(201)
    expect(response.body).toMatchObject({
      assignedLawyerId: admin.userId,
      displayPhoneNumber: '+5511999998888',
      status: 'active',
    })
    expect(fixture.metaFixture.requests.map(({ method }) => method)).toEqual(
      expect.arrayContaining(['GET', 'GET']),
    )
    expect(fixture.metaFixture.requests[0]?.path).toContain('client_id=local-meta-app-id')
    expect(fixture.metaFixture.requests[0]?.path).toContain(
      'client_secret=local-meta-app-secret',
    )
    expect(await fixture.channelsRepository.findById(response.body.id)).toMatchObject({
      assignedLawyerId: admin.userId,
      phoneNumberId: 'phone-local',
    })
  }, 30_000)

  it('rejects a non-admin collaborator', async () => {
    const token = await fixture.createSession()
    await request(fixture.app.getHttpServer())
      .post('/communication/waba/embedded-signup/exchange')
      .set('Authorization', token)
      .send({
        lawyerId: '00000000-0000-4000-8000-000000000001',
        code: 'local-code',
        wabaId: 'waba-local',
        phoneNumberId: 'phone-local',
      })
      .expect(403)
  }, 30_000)
})
