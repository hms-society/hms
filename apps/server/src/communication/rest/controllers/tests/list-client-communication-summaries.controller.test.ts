import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { CommunicationRestModuleFixture } from '@/communication/fixtures/communication-rest-module-fixture'

describe('List Client Communication Summaries Controller [GET /communications/summary]', () => {
  let fixture: CommunicationRestModuleFixture
  beforeAll(async () => {
    fixture = await CommunicationRestModuleFixture.register()
  })
  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture?.close())

  it('groups private messages by client in PostgreSQL', async () => {
    const token = await fixture.createSession()
    const client = await fixture.createClient()
    await fixture.messagesRepository.add({
      clientId: client.id,
      collaboratorId: randomUUID(),
      intakeId: randomUUID(),
      direction: 'incoming',
      content: 'Preciso de ajuda',
      fileIds: [],
    })
    const response = await request(fixture.app.getHttpServer())
      .get('/communications/summary')
      .set('Authorization', token)
      .expect(200)
    expect(response.body).toEqual([
      expect.objectContaining({
        clientId: client.id,
        inboundCount: 1,
        isLastMessageInbound: true,
      }),
    ])
  })

  it('requires authentication', async () => {
    await request(fixture.app.getHttpServer()).get('/communications/summary').expect(401)
  })
})
