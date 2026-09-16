import type { UseCase } from '#shared/interfaces/use-case'

import { DynamicFormFieldNotFoundError, DynamicFormNotFoundError } from '../domain/errors'
import type { DynamicFormUsageImpact } from '../domain/structures/dynamic-form-usage-impact'
import type { DynamicFormAdministrationRepository } from '../interfaces/dynamic-form-administration-repository'
import type { DynamicFormUsageProvider } from '../interfaces/dynamic-form-usage-provider'

type Request = {
  dynamicFormId: string
  fieldId: string
}

export class GetDynamicFormFieldUsageImpactUseCase
  implements UseCase<Request, DynamicFormUsageImpact>
{
  constructor(
    private readonly dynamicFormAdministrationRepository: DynamicFormAdministrationRepository,
    private readonly dynamicFormUsageProvider: DynamicFormUsageProvider,
  ) {}

  async execute({ dynamicFormId, fieldId }: Request): Promise<DynamicFormUsageImpact> {
    const form = await this.dynamicFormAdministrationRepository.findById(dynamicFormId)
    if (!form) throw new DynamicFormNotFoundError(dynamicFormId)
    if (!form.fields.some((field) => field.id === fieldId)) {
      throw new DynamicFormFieldNotFoundError(dynamicFormId, fieldId)
    }

    return this.dynamicFormUsageProvider.getFieldImpact(dynamicFormId, fieldId)
  }
}
