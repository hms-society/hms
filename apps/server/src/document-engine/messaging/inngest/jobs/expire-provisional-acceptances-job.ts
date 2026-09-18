import { Inject, Injectable } from '@nestjs/common'
import { type InngestFunction } from 'inngest'

import { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import { InngestJob } from '@/shared/messaging/inngest/inngest-job'
import { DOCUMENT_ENGINE_REPOSITORIES } from '@/document-engine/rest/controllers/request-document-exception.controller'
import type {
  DocumentExceptionsRepository,
  DocumentExceptionAuditLogsRepository,
} from '@hms/core/document-engine/interfaces'
import {
  DocumentExceptionStatus,
  DocumentExceptionType,
} from '@hms/core/document-engine/domain/structures'

@Injectable()
export class ExpireProvisionalAcceptancesJob extends InngestJob {
  static readonly ID = 'document-engine/expire-provisional-acceptances'
  readonly function: InngestFunction.Like

  constructor(
    inngest: InngestClient,
    @Inject(DOCUMENT_ENGINE_REPOSITORIES.documentExceptions)
    private readonly documentExceptionsRepository: DocumentExceptionsRepository,
    @Inject(DOCUMENT_ENGINE_REPOSITORIES.auditLogs)
    private readonly auditLogsRepository: DocumentExceptionAuditLogsRepository,
  ) {
    super(inngest)

    this.function = this.inngest.createFunction(
      {
        id: ExpireProvisionalAcceptancesJob.ID,
        name: 'Expire Provisional Acceptances',
        triggers: [{ cron: '0 0 * * *' }],
      },
      async ({ step }) => {
        const expiredCount = await step.run('expire-acceptances', async () => {
          const expiredExceptions =
            await this.documentExceptionsRepository.findExpiredProvisionalAcceptances()
          let count = 0

          for (const exception of expiredExceptions) {
            await this.documentExceptionsRepository.updateStatus(exception.id, {
              status: DocumentExceptionStatus.EXPIRED,
              reviewedBy: 'SYSTEM',
            })

            await this.auditLogsRepository.create({
              documentExceptionId: exception.id,
              action: 'EXPIRED',
              userId: 'SYSTEM',
            })

            count++
          }

          return count
        })

        return { expiredCount }
      },
    )
  }
}
