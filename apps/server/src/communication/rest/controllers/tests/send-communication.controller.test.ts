import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { CommunicationRestModuleFixture } from '@/communication/fixtures/communication-rest-module-fixture'

describe('Send Communication Controller [POST /communications/send]', () => {
  let fixture: CommunicationRestModuleFixture
  beforeAll(async () => {
    fixture = await CommunicationRestModuleFixture.register()
  })
  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture?.close())

  it('sends through the local Meta protocol and persists the message', async () => {
    const token = await fixture.createSession()
    const client = await fixture.createClient()
    const response = await request(fixture.app.getHttpServer())
      .post('/communications/send')
      .set('Authorization', token)
      .send({ clientId: client.id, channel: 'whatsapp', content: 'Olá' })
      .expect(201)
    expect(response.body.externalId).toBe('local-message-id')
    expect(fixture.metaFixture.requests).toContainEqual(
      expect.objectContaining({
        method: 'POST',
        body: expect.objectContaining({ type: 'text', to: client.phone }),
      }),
    )
    expect(await fixture.messagesRepository.findById(response.body.id)).toMatchObject({
      clientId: client.id,
      content: 'Olá',
    })
  })

  it('rejects a missing client through PostgreSQL lookup', async () => {
    const token = await fixture.createSession()
    await request(fixture.app.getHttpServer())
      .post('/communications/send')
      .set('Authorization', token)
      .send({
        clientId: '00000000-0000-4000-8000-000000000001',
        channel: 'whatsapp',
        content: 'Olá',
      })
      .expect(404)
  })
})
