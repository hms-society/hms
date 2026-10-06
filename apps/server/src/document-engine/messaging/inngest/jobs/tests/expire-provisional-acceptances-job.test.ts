import {
  DocumentExceptionStatus,
  DocumentExceptionType,
} from '@hms/core/document-engine/domain/structures'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { DocumentEngineModuleFixture } from '@/document-engine/fixtures/document-engine-module-fixture'
import { InngestFixture } from '@/shared/messaging/inngest/fixtures/inngest-fixture'
import { ExpireProvisionalAcceptancesJob } from '../expire-provisional-acceptances-job'

const CASE_ID = '280a32bf-e9ae-4784-8c72-7a4d762795e2'
const CREATED_BY = '79341eda-d65c-497c-a5bf-94c392031214'
const MANUAL_EVENT = 'integration/expire-provisional-acceptances'
const SYSTEM_ACTOR_ID = '00000000-0000-4000-8000-000000000000'

describe('ExpireProvisionalAcceptancesJob', () => {
  let inngestFixture: InngestFixture
  let documentEngineFixture: DocumentEngineModuleFixture
  let registeredCron: unknown

  beforeAll(async () => {
    documentEngineFixture = await DocumentEngineModuleFixture.register()
    try {
      inngestFixture = await InngestFixture.register({
        createFunctions(client) {
          const originalCreateFunction = client.createFunction.bind(client)
          const testClient = {
            createFunction(options: { triggers: unknown[] }, handler: unknown) {
              registeredCron = options.triggers[0]
              return originalCreateFunction(
                {
                  ...options,
                  triggers: [...options.triggers, { event: MANUAL_EVENT }],
                } as never,
                handler as never,
              )
            },
          }
          const job = new ExpireProvisionalAcceptancesJob(
            testClient as never,
            documentEngineFixture.documentExceptionsRepository,
            documentEngineFixture.documentExceptionAuditLogsRepository,
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

  it('expires an overdue acceptance and writes a system audit record via Inngest', async () => {
    expect(registeredCron).toEqual({ cron: '0 0 * * *' })
    const exception = await documentEngineFixture.documentExceptionsRepository.create({
      caseId: CASE_ID,
      type: DocumentExceptionType.ACEITE_PROVISORIO,
      status: DocumentExceptionStatus.PENDING,
      justification: 'Temporary acceptance',
      deadlineDate: new Date('2026-01-01T00:00:00.000Z'),
      createdBy: CREATED_BY,
    })

    await inngestFixture.client.send({ name: MANUAL_EVENT, data: {} })

    await expect
      .poll(
        () => documentEngineFixture.documentExceptionsRepository.findById(exception.id),
        { timeout: 20_000 },
      )
      .toMatchObject({
        status: DocumentExceptionStatus.EXPIRED,
        reviewedBy: SYSTEM_ACTOR_ID,
      })
    await expect
      .poll(() => documentEngineFixture.findExceptionAuditLogs(exception.id), {
        timeout: 20_000,
      })
      .toEqual([expect.objectContaining({ action: 'EXPIRED', userId: SYSTEM_ACTOR_ID })])
  }, 30_000)
})
