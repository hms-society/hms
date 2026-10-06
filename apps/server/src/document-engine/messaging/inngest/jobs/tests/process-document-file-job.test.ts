import {
  DocumentFileJsonOrganizationRequestedEvent,
  DocumentFileProcessingRequestedEvent,
} from '@hms/core/document-engine/domain/events'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { InngestFixture } from '@/shared/messaging/inngest/fixtures/inngest-fixture'
import { ProcessDocumentFileJob } from '../process-document-file-job'

const FILE_INPUT = {
  batchId: '8d307185-4869-4a3a-b781-2dae902f821d',
  documentFileId: '746d73af-b629-4fe9-a4ee-e4ea3c9b2ba1',
  storagePath: 'documents/file.pdf',
  originalName: 'file.pdf',
  mimeType: 'application/pdf',
  sizeBytes: 1024,
}
const HASH = 'a388cba9c4ec5b2a9bdbe8327e3a46d67e7261cc698f24ce4b7185041cbf4cd3'

describe('ProcessDocumentFileJob', () => {
  let fixture: InngestFixture
  const organizationRequests: Record<string, unknown>[] = []

  beforeAll(async () => {
    fixture = await InngestFixture.register({
      createFunctions(client) {
        const workflow = {
          run: async () => ({
            batchId: FILE_INPUT.batchId,
            documentFileId: FILE_INPUT.documentFileId,
            metadata: { hashSha256: HASH, extractedTextFull: 'Recognized text' },
          }),
        }
        const job = new ProcessDocumentFileJob(client, workflow as never)
        const observer = client.createFunction(
          {
            id: 'integration/observe-document-json-organization',
            triggers: [{ event: DocumentFileJsonOrganizationRequestedEvent._NAME }],
          },
          ({ event }) => {
            organizationRequests.push(event.data)
          },
        )
        return [job.function, observer]
      },
    })
  })

  afterAll(async () => {
    await fixture?.close()
  })

  it('dispatches the organization request after processing a PDF through Inngest', async () => {
    await fixture.client.send({
      name: DocumentFileProcessingRequestedEvent._NAME,
      data: FILE_INPUT,
    })

    await expect.poll(() => organizationRequests.length, { timeout: 20_000 }).toBe(1)
    expect(organizationRequests[0]).toMatchObject({
      ...FILE_INPUT,
      hashSha256: HASH,
      extractedTextFull: 'Recognized text',
    })
  }, 30_000)
})
