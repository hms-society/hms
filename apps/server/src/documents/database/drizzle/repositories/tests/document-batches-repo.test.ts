import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { RestFixture } from '@/shared/rest/tests/rest-fixture'
import { DocumentsDatabaseModule } from '@/documents/database/documents-database.module'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { clientModel, userModel } from '@/identity/database/drizzle/models'
import { documentBatchModel } from '../../models/document-batch-model'

describe('Document Batches Repository Constraints', () => {
  let fixture: RestFixture
  let db: ReturnType<DrizzleClient['requireDatabase']>

  beforeAll(async () => {
    fixture = await RestFixture.register({
      imports: [DocumentsDatabaseModule],
    })

    db = fixture.get(DrizzleClient).requireDatabase()
  })

  beforeEach(async () => {
    await fixture.resetDatabase()
  })

  afterAll(async () => {
    await fixture.close()
  })

  it('inserts a document batch successfully when linked to a valid client', async () => {
    const [client] = await db
      .insert(clientModel)
      .values({
        type: 'natural',
        name: 'Cliente Teste',
        taxIdType: 'cpf',
        taxIdValue: '12345678901',
      })
      .returning()

    const [user] = await db
      .insert(userModel)
      .values({
        id: randomUUID(),
        email: 'admin-test@hms.com.br',
        status: 'active',
      })
      .returning()

    const [batch] = await db
      .insert(documentBatchModel)
      .values({
        readableId: 'LOTE-20260804-0001',
        channel: 'internal_upload',
        sender: 'admin-test@hms.com.br',
        clientId: client.id,
        createdBy: user.id,
      })
      .returning()

    expect(batch.id).toBeDefined()
    expect(batch.clientId).toBe(client.id)
    expect(batch.status).toBe('received')
  })
})