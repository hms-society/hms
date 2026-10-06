import {
  DocumentBatchGenerationRequestedEvent,
  DocumentGenerationRequestedEvent,
} from '@hms/core/document-production/domain/events'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { InngestFixture } from '@/shared/messaging/inngest/fixtures/inngest-fixture'
import { GenerateDocumentsInBatchJob } from '../generate-documents-in-batch-job'

const DOCUMENTS = [
  {
    documentGenerationId: '78aa914d-5644-4cbd-82fd-f2b0e1b76194',
    documentId: 'd468c342-f7e1-4cf7-8600-40cc38ef812f',
    documentSpecificationVersionId: '929b77cf-a403-4c18-84c9-0cb0d6d67377',
  },
  {
    documentGenerationId: 'b746071b-fcc7-4f1b-b13c-1e124c4d9e36',
    documentId: '23992956-a08e-49d0-94ec-625564c2ab52',
    documentSpecificationVersionId: 'fe421987-d374-461d-99b7-931b4be00e78',
  },
]
const REQUESTED_BY = '79341eda-d65c-497c-a5bf-94c392031214'

describe('GenerateDocumentsInBatchJob', () => {
  let fixture: InngestFixture
  const received: Record<string, unknown>[] = []

  beforeAll(async () => {
    fixture = await InngestFixture.register({
      createFunctions(client) {
        const job = new GenerateDocumentsInBatchJob(client)
        const observer = client.createFunction(
          {
            id: 'integration/observe-document-generation',
            triggers: [{ event: DocumentGenerationRequestedEvent._NAME }],
          },
          ({ event }) => {
            received.push(event.data)
          },
        )
        return [job.function, observer]
      },
    })
  })

  afterAll(async () => {
    await fixture?.close()
  })

  it('fans out each document as an independently dispatched Inngest event', async () => {
    const source = { type: 'consultation' as const, id: 'consultation-1', data: {} }
    await fixture.client.send({
      name: DocumentBatchGenerationRequestedEvent._NAME,
      data: {
        documents: DOCUMENTS,
        requestedByCollaboratorId: REQUESTED_BY,
        source,
        occurredAt: new Date().toISOString(),
      },
    })

    await expect.poll(() => received.length, { timeout: 20_000 }).toBe(2)
    expect(received).toEqual(
      expect.arrayContaining(
        DOCUMENTS.map((document) =>
          expect.objectContaining({
            ...document,
            requestedByCollaboratorId: REQUESTED_BY,
          }),
        ),
      ),
    )
  }, 30_000)
})
