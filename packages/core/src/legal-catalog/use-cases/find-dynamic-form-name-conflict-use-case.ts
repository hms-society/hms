import type { UseCase } from '#shared/interfaces/use-case'

import type { FindDynamicFormNameConflictResult } from '../domain/structures/find-dynamic-form-name-conflict-result'
import type { DynamicFormAdministrationRepository } from '../interfaces/dynamic-form-administration-repository'

type Request = { name: string }

export class FindDynamicFormNameConflictUseCase
  implements UseCase<Request, FindDynamicFormNameConflictResult>
{
  constructor(
    private readonly dynamicFormAdministrationRepository: DynamicFormAdministrationRepository,
  ) {}

  async execute({ name }: Request): Promise<FindDynamicFormNameConflictResult> {
    const normalizedName = name.trim().toLocaleLowerCase('pt-BR')
    const existingForm =
      await this.dynamicFormAdministrationRepository.findByNormalizedName(normalizedName)

    return existingForm
      ? { conflict: true, existingDynamicFormId: existingForm.id }
      : { conflict: false }
  }
}
