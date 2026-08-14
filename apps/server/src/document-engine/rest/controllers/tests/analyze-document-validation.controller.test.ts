import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import request from 'supertest'

import { AnalyzeDocumentValidationController } from '@/document-engine/rest/controllers/analyze-document-validation.controller'
import { DocumentEngineModuleFixture } from '@/document-engine/fixtures/document-engine-module-fixture'
import { DocumentValidationAnalysisRequestedEvent } from '@hms/core/document-engine/domain/events'
import { DocumentBatchChannel } from '@hms/core/document-engine/domain/structures'
import { InngestService } from '@/shared/provision/inngest/inngest.service'

describe('Analyze Document Validation Controller [POST /document-validation/documents/:documentFileId/analyze]', () => {
  let fixture: DocumentEngineModuleFixture
  let userId: string
  let clientId: string
  const send = vi.fn()

  beforeAll(async () => {
    userId = randomUUID()
    fixture = await DocumentEngineModuleFixture.registerAuthenticated(
      AnalyzeDocumentValidationController,
      userId,
      (builder) =>
        builder.overrideProvider(InngestService).useValue({
          client: { send },
          register: vi.fn(),
          getFunctions: vi.fn(() => []),
        }),
    )
  })

  beforeEach(async () => {
    clientId = randomUUID()
    send.mockResolvedValue(undefined)
    send.mockClear()
    await fixture.resetDatabase()
    await fixture.seedUserAndClient(userId, clientId)
  })

  afterAll(async () => {
    await fixture.close()
  })

  it('queues the document analysis in Inngest without persisting immediately', async () => {
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
      .expect(202)

    expect(response.body).toEqual(
      expect.objectContaining({
        documentFileId: file?.id,
        status: 'analysis_queued',
        inngestEventName: DocumentValidationAnalysisRequestedEvent._NAME,
      }),
    )
    expect(send).toHaveBeenCalledWith({
      name: DocumentValidationAnalysisRequestedEvent._NAME,
      data: expect.objectContaining({
        documentFileId: file?.id,
        requestedBy: userId,
        occurredAt: expect.any(String),
      }),
    })

    const persistedDocument =
      await fixture.documentValidationsRepository.findByFileId(file?.id ?? '')

    expect(persistedDocument).toEqual(
      expect.objectContaining({
        id: file?.id,
        aiConfidence: undefined,
      }),
    )

    const logs =
      await fixture.documentValidationLogsRepository.listByDocumentFileId(file?.id ?? '')

    expect(logs).toEqual([])
  })
})
