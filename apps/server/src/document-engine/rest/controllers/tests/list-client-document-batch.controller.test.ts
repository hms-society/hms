import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { ListClientDocumentController } from '@/document-engine/rest/controllers/list-client-document-batch.controller'
import { DocumentEngineModuleFixture } from '@/document-engine/fixtures/document-engine-module-fixture'
import { DocumentBatchChannel } from '@hms/core/document-engine/domain/structures'

describe('List Client Document Batch Controller [GET /document-batches/clients/:clientId]', () => {
  let fixture: DocumentEngineModuleFixture

  beforeAll(async () => {
    fixture = await DocumentEngineModuleFixture.register(ListClientDocumentController)
  })

  beforeEach(async () => {
    await fixture.resetDatabase()
  })

  afterAll(async () => {
    await fixture.close()
  })

  it('lists document batches for a client', async () => {
    const userId = randomUUID()
    const clientId = randomUUID()
    await fixture.seedUserAndClient(userId, clientId)

    const batch = await fixture.documentBatchesRepository.add({
      readableId: `LOTE-${randomUUID()}`,
      channel: DocumentBatchChannel.InternalUpload,
      sender: 'lawyer@hms.com',
      inTriageBox: false,
      clientId,
      createdBy: userId,
      status: 'received',
      files: [
        {
          storagePath: 'client/file-123.pdf',
          originalName: 'test.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 1024,
        },
      ],
    })

    const response = await request(fixture.app.getHttpServer())
      .get(`/document-batches/clients/${clientId}`)
      .expect(200)

    expect(response.body).toHaveLength(1)
    expect(response.body[0]).toEqual(
      expect.objectContaining({
        id: batch.id,
        clientId,
        readableId: batch.readableId,
      }),
    )
  })
})
