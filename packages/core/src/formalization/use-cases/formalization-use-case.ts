import { CollaboratorProfile } from '../../identity/domain/structures'
import type { UseCase } from '../../shared/interfaces'
import type { Formalization } from '../domain/entities'
import {
  FormalizationAccessDeniedError,
  FormalizationContractFormOpenError,
  FormalizationStateConflictError,
} from '../domain/errors'
import { FormalizationContractFormState, FormalizationStatus } from '../domain/structures'
import type { FormalizationActor } from '../domain/structures'

export abstract class FormalizationUseCase<Request, Response = void>
  implements UseCase<Request, Response>
{
  abstract execute(request: Request): Promise<Response>

  protected isAdmin(actorProfile: FormalizationActor['actorProfile']): boolean {
    return actorProfile === CollaboratorProfile.Admin
  }

  protected assertAccess(assignedLawyerId: string, actor: FormalizationActor): void {
    if (assignedLawyerId !== actor.actorId && !this.isAdmin(actor.actorProfile)) {
      throw new FormalizationAccessDeniedError()
    }
  }

  protected assertFormClosed(
    formalization: Pick<Formalization, 'contractFormState'>,
  ): void {
    if (formalization.contractFormState !== FormalizationContractFormState.Closed) {
      throw new FormalizationContractFormOpenError()
    }
  }

  protected assertWritable(
    formalization: Pick<Formalization, 'contractFormState' | 'status'>,
  ): void {
    if (formalization.status === FormalizationStatus.Cancelled) {
      throw new FormalizationStateConflictError(
        'A formalização cancelada é somente leitura.',
      )
    }
    this.assertFormClosed(formalization)
  }
}
