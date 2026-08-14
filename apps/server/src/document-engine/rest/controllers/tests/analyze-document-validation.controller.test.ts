import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { AnalyzeDocumentValidationController } from '@/document-engine/rest/controllers/analyze-document-validation.controller'
import { DocumentEngineModuleFixture } from '@/document-engine/fixtures/document-engine-module-fixture'
import {
  DocumentBatchChannel,
  DocumentValidationLogAction,
  DocumentValidationStatus,
} from '@hms/core/document-engine/domain/structures'

describe('Analyze Document Validation Controller [POST /document-validation/documents/:documentFileId/analyze]', () => {
  let fixture: DocumentEngineModuleFixture
  let userId: string
  let clientId: string

  beforeAll(async () => {
    userId = randomUUID()
    fixture = await DocumentEngineModuleFixture.registerAuthenticated(
      AnalyzeDocumentValidationController,
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

  it('analyzes an existing document and persists the mock analysis', async () => {
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
      .post(`/document-validation/documents/${file?.id}/analyze`)
      .expect(201)

    expect(response.body).toEqual(
      expect.objectContaining({
        id: file?.id,
        status: DocumentValidationStatus.Valid,
        aiConfidence: 96,
      }),
    )
    expect(response.body.extractedFields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Titular', value: 'Mariana Costa Silva' }),
      ]),
    )

    const persistedDocument =
      await fixture.documentValidationsRepository.findByFileId(file?.id ?? '')

    expect(persistedDocument).toEqual(
      expect.objectContaining({
        id: file?.id,
        status: DocumentValidationStatus.Valid,
        aiConfidence: 96,
      }),
    )

    const logs =
      await fixture.documentValidationLogsRepository.listByDocumentFileId(file?.id ?? '')

    expect(logs).toEqual([
      expect.objectContaining({
        documentFileId: file?.id,
        actorId: userId,
        action: DocumentValidationLogAction.AnalysisRecorded,
        status: DocumentValidationStatus.Valid,
      }),
    ])
  })
})
