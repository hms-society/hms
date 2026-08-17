import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { DocumentEngineModuleFixture } from '@/document-engine/fixtures/document-engine-module-fixture'
import { ListDocumentValidationLogsController } from '@/document-engine/rest/controllers/list-document-validation-logs.controller'
import {
  DocumentBatchChannel,
  DocumentValidationLogAction,
  DocumentValidationStatus,
} from '@hms/core/document-engine/domain/structures'

describe('List Document Validation Logs Controller [GET /document-validation/documents/:documentFileId/logs]', () => {
  let fixture: DocumentEngineModuleFixture
  let userId: string
  let clientId: string

  beforeAll(async () => {
    userId = randomUUID()
    fixture = await DocumentEngineModuleFixture.registerAuthenticated(
      ListDocumentValidationLogsController,
      userId,
    )
  })

  beforeEach(async () => {
    clientId = randomUUID()
    await fixture.resetDatabase()
    await fixture.seedUserAndClient(userId, clientId)
  })

  afterAll(async () => {
    await fixture.close()
  })

  it('returns the validation history for a document file', async () => {
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
          storagePath: 'client/comprovante-residencia.pdf',
          originalName: 'comprovante-residencia.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 1024,
        },
      ],
    })

    const file = batch.files?.[0]
    expect(file).toBeDefined()

    await fixture.documentValidationLogsRepository.add({
      documentFileId: file?.id ?? '',
      actorId: userId,
      action: DocumentValidationLogAction.ResendRequested,
      status: DocumentValidationStatus.ResendRequested,
      reason: 'Documento incompleto.',
      message: 'Envie novamente o arquivo completo.',
    })

    const response = await request(fixture.app.getHttpServer())
      .get(`/document-validation/documents/${file?.id}/logs`)
      .expect(200)

    expect(response.body).toEqual([
      expect.objectContaining({
        documentFileId: file?.id,
        actorId: userId,
        action: DocumentValidationLogAction.ResendRequested,
        status: DocumentValidationStatus.ResendRequested,
        reason: 'Documento incompleto.',
        message: 'Envie novamente o arquivo completo.',
      }),
    ])
  })
})
