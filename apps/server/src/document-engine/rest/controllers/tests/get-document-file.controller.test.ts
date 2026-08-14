import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { GetDocumentFileController } from '@/document-engine/rest/controllers/get-document-file.controller'
import { DocumentEngineModuleFixture } from '@/document-engine/fixtures/document-engine-module-fixture'
import { DocumentBatchChannel } from '@hms/core/document-engine/domain/structures'

describe('Get Document File Controller [GET /documents/files/:fileId]', () => {
  let fixture: DocumentEngineModuleFixture

  beforeAll(async () => {
    fixture = await DocumentEngineModuleFixture.register(GetDocumentFileController)
  })

  beforeEach(async () => {
    await fixture.resetDatabase()
  })

  afterAll(async () => {
    await fixture.close()
  })

  it('returns 404 when file does not exist', async () => {
    const fileId = randomUUID()

    const response = await request(fixture.app.getHttpServer())
      .get(`/documents/files/${fileId}`)
      .expect(404)

    expect(response.body).toEqual(
      expect.objectContaining({
        statusCode: 404,
        message: 'Arquivo de documento não encontrado.',
      }),
    )
  })

  it('returns the document file when it exists', async () => {
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

    const file = batch?.files?.[0]
    expect(file).toBeDefined()

    const response = await request(fixture.app.getHttpServer())
      .get(`/documents/files/${file?.id}`)
      .expect(200)

    expect(response.body).toEqual(
      expect.objectContaining({
        id: file?.id,
        batchId: batch?.id,
        storagePath: 'client/file-123.pdf',
        originalName: 'test.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 1024,
      }),
    )
  })
})
