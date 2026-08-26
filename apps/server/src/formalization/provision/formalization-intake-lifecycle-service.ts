import { Inject, Injectable } from '@nestjs/common'
import type { FormalizationIntakeLifecycleService } from '@hms/core/formalization'
import type { FormalizationStartTransaction } from '@/formalization/database/formalization-start-transaction'

import { FORMALIZATION_DATABASE_OPERATIONS } from '@/formalization/constants/formalization-repositories'

@Injectable()
export class ServerFormalizationIntakeLifecycleService
  implements FormalizationIntakeLifecycleService
{
  constructor(
    @Inject(FORMALIZATION_DATABASE_OPERATIONS.startTransaction)
    private readonly startTransaction: FormalizationStartTransaction,
  ) {}

  startFormalization(
    request: Parameters<FormalizationIntakeLifecycleService['startFormalization']>[0],
  ) {
    return this.startTransaction.startFormalization(request)
  }
}
