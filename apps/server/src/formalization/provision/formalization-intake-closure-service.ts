import { Inject, Injectable } from '@nestjs/common'
import { CloseIntakeWithoutContractUseCase } from '@hms/core/intake/use-cases'
import type { IntakesRepository } from '@hms/core/intake/interfaces'
import type {
  CloseFormalizationIntakeRequest,
  FormalizationIntakeClosureService,
} from '@hms/core/formalization'

import { INTAKE_REPOSITORIES } from '@/intake/constants/intake-repositories'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'

@Injectable()
export class ServerFormalizationIntakeClosureService
  implements FormalizationIntakeClosureService
{
  private readonly useCase: CloseIntakeWithoutContractUseCase

  constructor(
    @Inject(INTAKE_REPOSITORIES.intakes) intakesRepository: IntakesRepository,
    datetimeProvider: DatetimeProvider,
  ) {
    this.useCase = new CloseIntakeWithoutContractUseCase(
      intakesRepository,
      datetimeProvider,
    )
  }

  closeWithoutContract(request: CloseFormalizationIntakeRequest) {
    return this.useCase.execute({
      intakeId: request.intakeId,
      expectedVersion: request.expectedVersion,
      closureReason: request.reason,
      closureNotes: request.notes,
      updatedBy: request.actorId,
    })
  }
}
