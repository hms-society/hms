import { Inject, Injectable } from '@nestjs/common'
import type {
  CloseFormalizationRequest,
  FormalizationIntakeClosureService,
} from '@hms/core/formalization'

import { FORMALIZATION_DATABASE_OPERATIONS } from '@/formalization/constants/formalization-repositories'
import type { FormalizationCloseTransaction } from '@/formalization/database/formalization-close-transaction'

@Injectable()
export class ServerFormalizationIntakeClosureService
  implements FormalizationIntakeClosureService
{
  constructor(
    @Inject(FORMALIZATION_DATABASE_OPERATIONS.closeTransaction)
    private readonly closeTransaction: FormalizationCloseTransaction,
  ) {}

  closeWithoutContract(request: CloseFormalizationRequest) {
    return this.closeTransaction.closeWithoutContract(request)
  }
}
