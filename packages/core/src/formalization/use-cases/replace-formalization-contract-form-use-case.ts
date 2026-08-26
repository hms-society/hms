import type { UseCase } from '../../shared/interfaces'
import type { DynamicForm } from '../../shared/domain/entities'
import type { Formalization } from '../domain/entities'
import {
  FormalizationContractFormReplacementError,
  FormalizationNotFoundError,
  FormalizationStateConflictError,
  FormalizationVersionConflictError,
} from '../domain/errors'
import { FormalizationContractFormState, FormalizationStatus } from '../domain/structures'
import type { FormalizationActor } from '../domain/structures'
import type { FormalizationSourceReader, FormalizationsRepository } from '../interfaces'
import { FormalizationActorAuthorization } from './formalization-actor-authorization'

type Request = FormalizationActor & {
  readonly formalizationId: string
  readonly expectedVersion: number
  readonly dynamicFormId: string
}

export class ReplaceFormalizationContractFormUseCase
  implements UseCase<Request, Formalization>
{
  constructor(
    private readonly formalizationsRepository: FormalizationsRepository,
    private readonly sourceReader: FormalizationSourceReader,
  ) {}

  async execute(request: Request): Promise<Formalization> {
    const formalization = await this.formalizationsRepository.findById(
      request.formalizationId,
    )
    if (!formalization) throw new FormalizationNotFoundError()

    FormalizationActorAuthorization.assertAccess(formalization.assignedLawyerId, request)

    if (
      formalization.status !== FormalizationStatus.InProgress ||
      formalization.contractFormState !== FormalizationContractFormState.Open ||
      formalization.documentsConfirmedAt
    ) {
      throw new FormalizationStateConflictError(
        'A ficha da formalização só pode ser substituída enquanto está aberta.',
      )
    }

    const form = await this.sourceReader.findContractForm(
      formalization,
      request.dynamicFormId,
    )
    if (!form) throw new FormalizationContractFormReplacementError()

    const updated = await this.formalizationsRepository.replace({
      formalizationId: formalization.id,
      expectedVersion: request.expectedVersion,
      changes: {
        contractFormId: form.id,
        contractFormSnapshot: toSnapshot(form),
        contractFormAnswers: [],
        contractFormState: FormalizationContractFormState.Open,
        contractFormRevision: 0,
        contractFormClosedAt: undefined,
        contractFormClosedByCollaboratorId: undefined,
        documentsConfirmedAt: undefined,
        documentsConfirmedByCollaboratorId: undefined,
        documentsConfirmedRevision: undefined,
      },
    })

    if (!updated) throw new FormalizationVersionConflictError()
    return updated
  }
}

function toSnapshot(form: DynamicForm) {
  return {
    dynamicFormId: form.id,
    name: form.name,
    description: form.description,
    fields: form.fields.map((field) => ({ ...field })),
  }
}
