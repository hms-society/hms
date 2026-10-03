import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { CommunicationRestModuleFixture } from '@/communication/fixtures/communication-rest-module-fixture'

describe('List Client Communications Controller [GET /communications/clients/:clientId]', () => {
  let fixture: CommunicationRestModuleFixture
  beforeAll(async () => {
    fixture = await CommunicationRestModuleFixture.register()
  })
  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture?.close())

  it('returns decrypted messages for the requested client from PostgreSQL', async () => {
    const token = await fixture.createSession()
    const client = await fixture.createClient()
    const other = await fixture.createClient()
    await fixture.messagesRepository.add({
      clientId: client.id,
      collaboratorId: randomUUID(),
      intakeId: randomUUID(),
      direction: 'incoming',
      content: 'Mensagem privada',
      fileIds: [],
    })
    await fixture.messagesRepository.add({
      clientId: other.id,
      collaboratorId: randomUUID(),
      intakeId: randomUUID(),
      direction: 'incoming',
      content: 'Outro cliente',
      fileIds: [],
    })
    const response = await request(fixture.app.getHttpServer())
      .get(`/communications/clients/${client.id}`)
      .set('Authorization', token)
      .expect(200)
    expect(response.body).toEqual([
      expect.objectContaining({ content: 'Mensagem privada', author: 'Cliente' }),
    ])
  })

  it('requires a Supabase Auth session', async () => {
    await request(fixture.app.getHttpServer())
      .get(`/communications/clients/${randomUUID()}`)
      .expect(401)
  })
})
