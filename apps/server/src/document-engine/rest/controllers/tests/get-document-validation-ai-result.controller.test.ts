import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { DocumentEngineModuleFixture } from '@/document-engine/fixtures/document-engine-module-fixture'
import { GetDocumentValidationAiResultController } from '@/document-engine/rest/controllers/get-document-validation-ai-result.controller'
import {
  DocumentBatchChannel,
  DocumentValidationStatus,
} from '@hms/core/document-engine/domain/structures'

describe('Get Document Validation AI Result Controller [POST /document-validation/documents/:documentFileId/ai-result]', () => {
  let fixture: DocumentEngineModuleFixture
  let userId: string
  let clientId: string

  beforeAll(async () => {
    userId = randomUUID()
    fixture = await DocumentEngineModuleFixture.registerAuthenticated(
      GetDocumentValidationAiResultController,
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

  it('returns the AI result without persisting it into the document file', async () => {
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
          storagePath: 'seed/client/comprovante-residencia.pdf',
          originalName: 'comprovante-residencia.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 1024,
        },
      ],
    })

    const file = batch.files?.[0]
    expect(file).toBeDefined()

    const response = await request(fixture.app.getHttpServer())
      .post(`/document-validation/documents/${file?.id}/ai-result`)
      .expect(201)

    expect(response.body).toEqual(
      expect.objectContaining({
        status: DocumentValidationStatus.Valid,
        aiConfidence: expect.any(Number),
        extractedFields: expect.arrayContaining([
          expect.objectContaining({
            label: 'Titular',
            value: 'Mariana Costa Silva',
          }),
        ]),
        aiSuggestion: expect.objectContaining({
          provider: expect.any(String),
        }),
      }),
    )

    const persistedDocument =
      await fixture.documentValidationsRepository.findByFileId(file?.id ?? '')

    expect(persistedDocument).toEqual(
      expect.objectContaining({
        id: file?.id,
        status: DocumentValidationStatus.AwaitingValidation,
        aiConfidence: undefined,
        extractedFields: [],
        missingFields: [],
      }),
    )
  })
})
