import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import request from 'supertest'
import { RestFixture } from '@/shared/rest/tests/rest-fixture'
import { AuthGuard } from '@/identity/guards'
import { SendCommunicationController } from '../send-communication.controller'
import { SharedDatabaseModule } from '@/shared/database/drizzle/database.module'
import { IdentityModule } from '@/identity/identity.module'
import { CommunicationModule as SharedCommunicationModule } from '@/shared/communication/communication.module'
import { WhatsappProvider } from '@/shared/communication/whatsapp.provider'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { clientModel } from '@/identity/database/drizzle/models/client-model'
import { userModel } from '@/identity/database/drizzle/models/user-model'
import { privateMessageModel } from '@/communication/database/drizzle/models/private-message-model'
import { decrypt } from '@/shared/utils/crypto'
import { eq } from 'drizzle-orm'

describe('Send Communication Controller [POST /communications/send]', () => {
  let fixture: RestFixture
  let mockWhatsappProvider: { sendTextMessage: any }
  let drizzleClient: DrizzleClient
  let clientId: string
  const authorId = '0b2e88a0-2f3b-48bb-a0f1-0bc4b9be38f0'

  beforeAll(async () => {
    mockWhatsappProvider = {
      sendTextMessage: vi
        .fn()
        .mockResolvedValue({ externalMessageId: 'test-external-id' }),
    }

    fixture = await RestFixture.register(
      {
        imports: [SharedDatabaseModule, IdentityModule, SharedCommunicationModule],
        controllers: [SendCommunicationController],
      },
      (builder) =>
        builder
          .overrideGuard(AuthGuard)
          .useValue({
            canActivate: (context: any) => {
              const req = context.switchToHttp().getRequest()
              req.user = { id: authorId, email: 'lawyer@hms.com' }
              return true
            },
          })
          .overrideProvider(WhatsappProvider)
          .useValue(mockWhatsappProvider),
    )

    drizzleClient = fixture.get(DrizzleClient)
  })

  beforeEach(async () => {
    await fixture.resetDatabase()
    const db = drizzleClient.requireDatabase()

    await db.insert(userModel).values({
      id: authorId,
      email: 'lawyer@hms.com',
      status: 'active',
    })

    clientId = 'd94f2d5f-1ffb-4654-be8c-9c941e737bd0'
    await db.insert(clientModel).values({
      id: clientId,
      type: 'natural',
      name: 'Client Test',
      taxIdType: 'cpf',
      taxIdValue: '12345678909',
      phone: '5519971659516',
    })
  })

  afterAll(async () => fixture.close())

  it('sends a whatsapp text message and saves it to the database', async () => {
    const response = await request(fixture.app.getHttpServer())
      .post('/communications/send')
      .send({
        clientId,
        content: 'Olá, este é um teste.',
        channel: 'whatsapp',
      })
      .expect(201)

    expect(mockWhatsappProvider.sendTextMessage).toHaveBeenCalledWith(
      '5519971659516',
      'Olá, este é um teste.',
    )

    expect(response.body).toEqual(
      expect.objectContaining({
        content: 'Olá, este é um teste.',
        channel: 'whatsapp',
        direction: 'outbound',
        author: 'lawyer@hms.com',
        externalId: 'test-external-id',
      }),
    )

    const db = drizzleClient.requireDatabase()
    const records = await db
      .select()
      .from(privateMessageModel)
      .where(eq(privateMessageModel.clientId, clientId))

    expect(records.length).toBe(1)
    expect(records[0].content ? decrypt(records[0].content) : '').toBe(
      'Olá, este é um teste.',
    )
    expect(records[0].direction).toBe('outbound')
  })

  it('returns 400 when client has no phone number', async () => {
    const db = drizzleClient.requireDatabase()
    const noPhoneClientId = 'c75a40a8-b648-43e5-8f4b-70c8f583e782'
    await db.insert(clientModel).values({
      id: noPhoneClientId,
      type: 'natural',
      name: 'Client No Phone',
      taxIdType: 'cpf',
      taxIdValue: '98765432109',
      phone: null,
    })

    await request(fixture.app.getHttpServer())
      .post('/communications/send')
      .send({
        clientId: noPhoneClientId,
        content: 'Olá, este é um teste.',
        channel: 'whatsapp',
      })
      .expect(400)
  })

  it('returns 404 when client does not exist', async () => {
    await request(fixture.app.getHttpServer())
      .post('/communications/send')
      .send({
        clientId: '9e0b83e4-84c6-4796-a519-74d754be00f3',
        content: 'Olá, este é um teste.',
        channel: 'whatsapp',
      })
      .expect(404)
  })
})
