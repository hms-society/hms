import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { DocumentBatchChannel } from '@hms/core/document-engine/domain/structures'

import { DocumentEngineModuleFixture } from '@/document-engine/fixtures/document-engine-module-fixture'

describe('List Client Document Controller [GET /document-batches/clients/:clientId]', () => {
  let fixture: DocumentEngineModuleFixture
  beforeAll(async () => {
    fixture = await DocumentEngineModuleFixture.register()
  })
  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture?.close())

  it('returns only persisted batches for the requested client', async () => {
    const clientId = randomUUID()
    const userId = randomUUID()
    await fixture.seedUserAndClient(userId, clientId)
    const batch = await fixture.documentBatchesRepository.add({
      readableId: `LOTE-${randomUUID()}`,
      channel: DocumentBatchChannel.InternalUpload,
      sender: 'lawyer@hms.com',
      inTriageBox: false,
      clientId,
      createdBy: userId,
      status: 'identified',
      files: [
        {
          storagePath: `tests/${randomUUID()}/proof.pdf`,
          originalName: 'proof.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 12,
        },
      ],
    })
    const response = await request(fixture.app.getHttpServer())
      .get(`/document-batches/clients/${clientId}`)
      .expect(200)
    expect(response.body).toEqual([expect.objectContaining({ id: batch.id, clientId })])
    await request(fixture.app.getHttpServer())
      .get(`/document-batches/clients/${randomUUID()}`)
      .expect(200, [])
  })
})
