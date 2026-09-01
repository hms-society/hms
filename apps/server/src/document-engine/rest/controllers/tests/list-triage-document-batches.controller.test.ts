import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { DocumentEngineModuleFixture } from '@/document-engine/fixtures/document-engine-module-fixture'
import { ListTriageDocumentBatchesController } from '@/document-engine/rest/controllers/list-triage-document-batches.controller'
import {
  DocumentBatchChannel,
  DocumentBatchStatus,
} from '@hms/core/document-engine/domain/structures'

describe('List Triage Document Batches Controller [GET /document-batches/triage]', () => {
  let fixture: DocumentEngineModuleFixture
  let unauthFixture: DocumentEngineModuleFixture
  let userId: string

  beforeAll(async () => {
    userId = randomUUID()
    fixture = await DocumentEngineModuleFixture.registerAuthenticated(
      ListTriageDocumentBatchesController,
      userId,
    )
    unauthFixture = await DocumentEngineModuleFixture.register(
      ListTriageDocumentBatchesController,
    )
  })

  beforeEach(async () => {
    await fixture.resetDatabase()
    await unauthFixture.resetDatabase()
  })

  afterAll(async () => {
    await fixture.close()
    await unauthFixture.close()
  })

  it('rejects unauthenticated requests with 401', async () => {
    await request(unauthFixture.app.getHttpServer())
      .get('/document-batches/triage')
      .expect(401)
  })

  it('returns document batches currently in triage box for authenticated collaborators', async () => {
    await fixture.documentBatchesRepository.add({
      readableId: 'LOTE-20260826-0001',
      channel: DocumentBatchChannel.WhatsApp,
      sender: '5511999998888',
      inTriageBox: true,
      status: DocumentBatchStatus.PendingIdentification,
      files: [],
    })

    const response = await request(fixture.app.getHttpServer())
      .get('/document-batches/triage')
      .expect(200)

    expect(response.body).toMatchObject({
      total: 1,
      page: 1,
      limit: 20,
    })
    expect(response.body.items).toHaveLength(1)
    expect(response.body.items[0]).toMatchObject({
      readableId: 'LOTE-20260826-0001',
      channel: DocumentBatchChannel.WhatsApp,
      inTriageBox: true,
      status: DocumentBatchStatus.PendingIdentification,
    })
  })
})
