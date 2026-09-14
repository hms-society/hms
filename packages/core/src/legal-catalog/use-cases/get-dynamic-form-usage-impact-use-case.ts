import type { UseCase } from '#shared/interfaces/use-case'

import { DynamicFormNotFoundError } from '../domain/errors'
import type { DynamicFormUsageImpact } from '../domain/structures/dynamic-form-usage-impact'
import type { DynamicFormAdministrationRepository } from '../interfaces/dynamic-form-administration-repository'
import type { DynamicFormUsageProvider } from '../interfaces/dynamic-form-usage-provider'

type Request = { dynamicFormId: string }

export class GetDynamicFormUsageImpactUseCase
  implements UseCase<Request, DynamicFormUsageImpact>
{
  constructor(
    private readonly dynamicFormAdministrationRepository: DynamicFormAdministrationRepository,
    private readonly dynamicFormUsageProvider: DynamicFormUsageProvider,
  ) {}

  async execute({ dynamicFormId }: Request): Promise<DynamicFormUsageImpact> {
    const form = await this.dynamicFormAdministrationRepository.findById(dynamicFormId)
    if (!form) throw new DynamicFormNotFoundError(dynamicFormId)

    return this.dynamicFormUsageProvider.getImpact(dynamicFormId)
  }
}
