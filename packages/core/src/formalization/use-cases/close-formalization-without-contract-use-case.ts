import type { DatetimeProvider, UseCase } from '../../shared/interfaces'
import type { Formalization } from '../domain/entities'
import {
  FormalizationNotFoundError,
  FormalizationStateConflictError,
} from '../domain/errors'
import { FormalizationStatus } from '../domain/structures'
import type { FormalizationActor } from '../domain/structures'
import type {
  FormalizationIntakeClosureService,
  FormalizationsRepository,
  CloseFormalizationIntakeRequest,
} from '../interfaces'
import { FormalizationActorAuthorization } from './formalization-actor-authorization'

type Request = CloseFormalizationIntakeRequest & FormalizationActor & {
  readonly formalizationId: string
  readonly expectedFormalizationVersion: number
}

export class CloseFormalizationWithoutContractUseCase
  implements UseCase<Request, Formalization>
{
  constructor(
    private readonly formalizationsRepository: FormalizationsRepository,
    private readonly intakeClosureService: FormalizationIntakeClosureService,
    private readonly datetimeProvider: DatetimeProvider,
  ) {}

  async execute(request: Request): Promise<Formalization> {
    const formalization = await this.formalizationsRepository.findById(request.formalizationId)
    if (!formalization) throw new FormalizationNotFoundError()
    FormalizationActorAuthorization.assertAccess(formalization.assignedLawyerId, request)
    if (request.intakeId !== formalization.intakeId) {
      throw new FormalizationStateConflictError(
        'O Intake informado não pertence à formalização autorizada.',
      )
    }
    if (formalization.status === FormalizationStatus.Cancelled) return formalization
    if (formalization.status !== FormalizationStatus.InProgress) {
      throw new FormalizationStateConflictError()
    }

    return this.intakeClosureService.closeWithoutContract({
      formalizationId: formalization.id,
      intakeId: formalization.intakeId,
      actorId: request.actorId,
      reason: request.reason,
      notes: request.notes,
      expectedIntakeVersion: request.expectedVersion,
      expectedFormalizationVersion: request.expectedFormalizationVersion,
      cancelledAt: this.datetimeProvider.now(),
    })
  }
}
