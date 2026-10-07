import { DocumentFileJsonOrganizationRequestedEvent } from '@hms/core/document-engine/domain/events'
import {
  DocumentBatchChannel,
  DocumentBatchStatus,
  DocumentValidationStatus,
} from '@hms/core/document-engine/domain/structures'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { DocumentEngineModuleFixture } from '@/document-engine/fixtures/document-engine-module-fixture'
import { InngestFixture } from '@/shared/messaging/inngest/fixtures/inngest-fixture'
import { OrganizeDocumentFileJsonWithOllamaJob } from '../organize-document-file-json-with-ollama-job'

const HASH = 'a388cba9c4ec5b2a9bdbe8327e3a46d67e7261cc698f24ce4b7185041cbf4cd3'

describe('OrganizeDocumentFileJsonWithOllamaJob', () => {
  let inngestFixture: InngestFixture
  let documentEngineFixture: DocumentEngineModuleFixture

  beforeAll(async () => {
    documentEngineFixture = await DocumentEngineModuleFixture.register()
    try {
      inngestFixture = await InngestFixture.register({
        createFunctions(client) {
          const agent = {
            generate: async () => ({
              text: JSON.stringify({
                confidence: 0.9,
                extractedFields: [
                  { label: 'Nome', value: 'Ana Silva', confidence: 0.98 },
                ],
                evidence: [{ field: 'Nome', sourceText: 'Nome: Ana Silva' }],
              }),
            }),
          }
          const job = new OrganizeDocumentFileJsonWithOllamaJob(
            client,
            agent as never,
            documentEngineFixture.documentValidationsRepository,
          )
          return [job.function]
        },
      })
    } catch (error) {
      await documentEngineFixture.close()
      throw error
    }
  })

  afterAll(async () => {
    try {
      await inngestFixture?.close()
    } finally {
      await documentEngineFixture?.close()
    }
  })

  it('records verified OCR fields in PostgreSQL after Inngest dispatch', async () => {
    const batch = await documentEngineFixture.documentBatchesRepository.add({
      readableId: 'LOTE-20261002-0001',
      status: DocumentBatchStatus.Received,
      channel: DocumentBatchChannel.InternalUpload,
      sender: 'integration-test',
      inTriageBox: true,
      files: [
        {
          storagePath: 'documents/ana-silva.pdf',
          originalName: 'ana-silva.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 1024,
          status: DocumentValidationStatus.Processing,
        },
      ],
    })
    const file = batch.files?.[0]
    if (!file) throw new Error('Document file was not created')

    await inngestFixture.client.send({
      name: DocumentFileJsonOrganizationRequestedEvent._NAME,
      data: {
        batchId: batch.id,
        documentFileId: file.id,
        storagePath: file.storagePath,
        originalName: file.originalName,
        mimeType: file.mimeType,
        sizeBytes: file.sizeBytes,
        hashSha256: HASH,
        extractedTextFull: 'Nome: Ana Silva',
      },
    })

    await expect
      .poll(
        () => documentEngineFixture.documentValidationsRepository.findByFileId(file.id),
        { timeout: 20_000 },
      )
      .toMatchObject({
        status: DocumentValidationStatus.NotLinked,
        hashSha256: HASH,
        extractedFields: [expect.objectContaining({ label: 'Nome', value: 'Ana Silva' })],
      })
  }, 30_000)
})
