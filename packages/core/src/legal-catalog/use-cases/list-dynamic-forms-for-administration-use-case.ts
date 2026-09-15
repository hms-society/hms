import type { UseCase } from '#shared/interfaces/use-case'

import type { DynamicFormListQuery } from '../domain/structures/dynamic-form-list-query'
import type { DynamicFormListResult } from '../domain/structures/dynamic-form-list-result'
import type { DynamicFormAdministrationRepository } from '../interfaces/dynamic-form-administration-repository'

export class ListDynamicFormsForAdministrationUseCase
  implements UseCase<DynamicFormListQuery, DynamicFormListResult>
{
  constructor(
    private readonly dynamicFormAdministrationRepository: DynamicFormAdministrationRepository,
  ) {}

  execute(query: DynamicFormListQuery): Promise<DynamicFormListResult> {
    return this.dynamicFormAdministrationRepository.list(query)
  }
}
