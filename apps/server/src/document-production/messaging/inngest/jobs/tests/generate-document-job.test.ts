import { DocumentGenerationRequestedEvent } from '@hms/core/document-production/domain/events'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { DocumentProductionModuleFixture } from '@/document-production/fixtures/document-production-module-fixture'
import { InngestFixture } from '@/shared/messaging/inngest/fixtures/inngest-fixture'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { GenerateDocumentJob } from '../generate-document-job'

const GENERATION_ID = '78aa914d-5644-4cbd-82fd-f2b0e1b76194'
const DOCUMENT_ID = 'd468c342-f7e1-4cf7-8600-40cc38ef812f'
const SPECIFICATION_VERSION_ID = '929b77cf-a403-4c18-84c9-0cb0d6d67377'
const REQUESTED_BY = '79341eda-d65c-497c-a5bf-94c392031214'

describe('GenerateDocumentJob', () => {
  let inngestFixture: InngestFixture
  let documentProductionFixture: DocumentProductionModuleFixture
  const workflowInputs: Record<string, unknown>[] = []

  beforeAll(async () => {
    documentProductionFixture = await DocumentProductionModuleFixture.register()
    try {
      inngestFixture = await InngestFixture.register({
        createFunctions(client) {
          const workflow = {
            run: async (input: Record<string, unknown>) => {
              workflowInputs.push(input)
            },
          }
          const job = new GenerateDocumentJob(
            client,
            workflow as never,
            documentProductionFixture.generationsRepository,
            new DatetimeProvider(),
          )
          return [job.function]
        },
      })
    } catch (error) {
      await documentProductionFixture.close()
      throw error
    }
  })

  afterAll(async () => {
    try {
      await inngestFixture?.close()
    } finally {
      await documentProductionFixture?.close()
    }
  })

  it('receives the generation request through Inngest and forwards its source snapshot', async () => {
    const source = {
      type: 'consultation' as const,
      id: 'consultation-1',
      data: { client: { name: 'Test Client' } },
    }
    await inngestFixture.client.send({
      name: DocumentGenerationRequestedEvent._NAME,
      data: {
        documentGenerationId: GENERATION_ID,
        documentId: DOCUMENT_ID,
        documentSpecificationVersionId: SPECIFICATION_VERSION_ID,
        requestedByCollaboratorId: REQUESTED_BY,
        source,
        occurredAt: new Date().toISOString(),
      },
    })

    await expect.poll(() => workflowInputs.length, { timeout: 20_000 }).toBe(1)
    expect(workflowInputs[0]).toEqual({
      documentGenerationId: GENERATION_ID,
      documentId: DOCUMENT_ID,
      documentSpecificationVersionId: SPECIFICATION_VERSION_ID,
      requestedByCollaboratorId: REQUESTED_BY,
      instructions: undefined,
      source,
    })
  }, 30_000)
})
