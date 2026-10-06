import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { DocumentEngineModuleFixture } from '@/document-engine/fixtures/document-engine-module-fixture'
import { ListDocumentValidationsController } from '@/document-engine/rest/controllers/list-document-validations.controller'
import {
  DocumentBatchChannel,
  DocumentValidationStatus,
} from '@hms/core/document-engine/domain/structures'

describe('List Document Validations Controller [GET /document-validation/documents]', () => {
  let fixture: DocumentEngineModuleFixture
  let userId: string
  let clientId: string

  beforeAll(async () => {
    userId = randomUUID()
    fixture = await DocumentEngineModuleFixture.registerAuthenticated(
      ListDocumentValidationsController,
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

  it('filters persisted files by validation status', async () => {
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
          storagePath: 'client/first.pdf',
          originalName: 'first.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 12,
          status: DocumentValidationStatus.AwaitingValidation,
        },
        {
          storagePath: 'client/second.pdf',
          originalName: 'second.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 13,
          status: DocumentValidationStatus.ResendRequested,
        },
      ],
    })

    const response = await request(fixture.app.getHttpServer())
      .get('/document-validation/documents')
      .query({ status: DocumentValidationStatus.ResendRequested })
      .expect(200)

    expect(response.body).toEqual([
      expect.objectContaining({
        id: batch.files?.[1]?.id,
        fileName: 'second.pdf',
        status: DocumentValidationStatus.ResendRequested,
      }),
    ])
  })

  it('rejects an invalid case identifier', async () => {
    await request(fixture.app.getHttpServer())
      .get('/document-validation/documents')
      .query({ caseId: 'invalid' })
      .expect(400)
  })
})
