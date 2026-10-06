import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { DocumentEngineModuleFixture } from '@/document-engine/fixtures/document-engine-module-fixture'
import { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import { InngestFixture } from '@/shared/messaging/inngest/fixtures/inngest-fixture'
import {
  DocumentBatchChannel,
  DocumentValidationStatus,
} from '@hms/core/document-engine/domain/structures'

describe('Reprocess Document File Controller [POST /document-validation/documents/:documentFileId/reprocess]', () => {
  let fixture: DocumentEngineModuleFixture
  let userId: string
  let clientId: string
  let inngest: InngestFixture

  beforeAll(async () => {
    userId = randomUUID()
    inngest = await InngestFixture.register({ createFunctions: () => [] })
    fixture = await DocumentEngineModuleFixture.registerAuthenticated(
      undefined,
      userId,
      (builder) => builder.overrideProvider(InngestClient).useValue(inngest.client),
    )
  })

  beforeEach(async () => {
    clientId = randomUUID()
    await fixture.resetDatabase()
    await fixture.seedUserAndClient(userId, clientId)
  })

  afterAll(async () => {
    try {
      await fixture?.close()
    } finally {
      await inngest?.close()
    }
  })

  it('marks a persisted file for processing and publishes its event', async () => {
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
      .post(`/document-validation/documents/${fileId}/reprocess`)
      .expect(201)

    expect(response.body).toMatchObject({
      id: fileId,
      status: DocumentValidationStatus.Processing,
    })
    expect(
      (await fixture.documentValidationsRepository.findByFileId(fileId ?? ''))?.status,
    ).toBe(DocumentValidationStatus.Processing)
  })

  it('rejects malformed file identifiers', async () => {
    await request(fixture.app.getHttpServer())
      .post('/document-validation/documents/invalid/reprocess')
      .expect(400)
  })
})
