import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { DocumentEngineModuleFixture } from '@/document-engine/fixtures/document-engine-module-fixture'
import { GetDocumentValidationController } from '@/document-engine/rest/controllers/get-document-validation.controller'
import {
  DocumentBatchChannel,
  DocumentValidationStatus,
} from '@hms/core/document-engine/domain/structures'

describe('Get Document Validation Controller [GET /document-validation/documents/:documentFileId]', () => {
  let fixture: DocumentEngineModuleFixture
  let userId: string
  let clientId: string

  beforeAll(async () => {
    userId = randomUUID()
    fixture = await DocumentEngineModuleFixture.registerAuthenticated(
      GetDocumentValidationController,
      userId,
    )
  })

  beforeEach(async () => {
    clientId = randomUUID()
    await fixture.resetDatabase()
    await fixture.seedUserAndClient(userId, clientId)
  })

  afterAll(async () => {
    await fixture?.close()
  })

  it('returns the persisted validation document', async () => {
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
          storagePath: 'client/file.pdf',
          originalName: 'file.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 12,
          status: DocumentValidationStatus.AwaitingValidation,
        },
      ],
    })
    const fileId = batch.files?.[0]?.id
    expect(fileId).toBeDefined()

    const response = await request(fixture.app.getHttpServer())
      .get(`/document-validation/documents/${fileId}`)
      .expect(200)

    expect(response.body).toMatchObject({
      id: fileId,
      batchId: batch.id,
      fileName: 'file.pdf',
      clientId,
      status: DocumentValidationStatus.AwaitingValidation,
    })
  })

  it('returns a not found error for an unknown file', async () => {
    await request(fixture.app.getHttpServer())
      .get(`/document-validation/documents/${randomUUID()}`)
      .expect(404)
  })
})
