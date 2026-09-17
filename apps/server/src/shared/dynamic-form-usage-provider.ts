import { Inject, Injectable } from '@nestjs/common'
import type { FormalizationDynamicFormUsageProvider } from '@hms/core/formalization/interfaces'
import type { DynamicFormUsageImpact } from '@hms/core/legal-catalog/domain/structures'
import type { DynamicFormUsageProvider as DynamicFormUsageProviderContract } from '@hms/core/legal-catalog/interfaces'

import { FORMALIZATION_PROVIDERS } from '@/formalization/constants/formalization-providers'

@Injectable()
export class DynamicFormUsageProvider implements DynamicFormUsageProviderContract {
  constructor(
    @Inject(FORMALIZATION_PROVIDERS.dynamicFormUsage)
    private readonly formalizationProvider: FormalizationDynamicFormUsageProvider,
  ) {}

  async getImpact(dynamicFormId: string): Promise<DynamicFormUsageImpact> {
    return {
      formalization: await this.formalizationProvider.countByDynamicFormId(dynamicFormId),
    }
  }

  async getFieldImpact(
    dynamicFormId: string,
    fieldId: string,
  ): Promise<DynamicFormUsageImpact> {
    return {
      formalization: await this.formalizationProvider.countByDynamicFormFieldId({
        dynamicFormId,
        fieldId,
      }),
    }
  }
}
