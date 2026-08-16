import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { DocumentEngineModuleFixture } from '@/document-engine/fixtures/document-engine-module-fixture'
import { RequestDocumentResendController } from '@/document-engine/rest/controllers/request-document-resend.controller'
import {
  DocumentBatchChannel,
  DocumentValidationLogAction,
  DocumentValidationStatus,
} from '@hms/core/document-engine/domain/structures'

describe('Request Document Resend Controller [POST /document-validation/documents/:documentFileId/resend-request]', () => {
  let fixture: DocumentEngineModuleFixture
  let userId: string
  let clientId: string

  beforeAll(async () => {
    userId = randomUUID()
    fixture = await DocumentEngineModuleFixture.registerAuthenticated(
      RequestDocumentResendController,
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

  it('records resend request and stores the sent message in the validation log', async () => {
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

    const response = await request(fixture.app.getHttpServer())
      .post(`/document-validation/documents/${file?.id}/resend-request`)
      .send({
        reason: 'Documento incompleto.',
        message: 'Envie novamente o arquivo completo.',
      })
      .expect(201)

    expect(response.body).toEqual(
      expect.objectContaining({
        id: file?.id,
        status: DocumentValidationStatus.ResendRequested,
        reviewedBy: userId,
      }),
    )
    expect(response.body.humanCorrection).toEqual(
      expect.objectContaining({
        reason: 'Documento incompleto.',
        message: 'Envie novamente o arquivo completo.',
      }),
    )

    const logs = await fixture.documentValidationLogsRepository.listByDocumentFileId(
      file?.id ?? '',
    )

    expect(logs).toEqual([
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
