import { Inject, Injectable } from '@nestjs/common'
import type { ConsultationDynamicFormUsageProvider } from '@hms/core/consultation/interfaces'
import type { FormalizationDynamicFormUsageProvider } from '@hms/core/formalization/interfaces'
import type { DynamicFormUsageImpact } from '@hms/core/legal-catalog/domain/structures'
import type { DynamicFormUsageProvider as DynamicFormUsageProviderContract } from '@hms/core/legal-catalog/interfaces'

import { CONSULTATION_PROVIDERS } from '@/consultation/constants/consultation-providers'
import { FORMALIZATION_PROVIDERS } from '@/formalization/constants/formalization-providers'

@Injectable()
export class DynamicFormUsageProvider implements DynamicFormUsageProviderContract {
  constructor(
    @Inject(CONSULTATION_PROVIDERS.dynamicFormUsage)
    private readonly consultationProvider: ConsultationDynamicFormUsageProvider,
    @Inject(FORMALIZATION_PROVIDERS.dynamicFormUsage)
    private readonly formalizationProvider: FormalizationDynamicFormUsageProvider,
  ) {}

  async getImpact(dynamicFormId: string): Promise<DynamicFormUsageImpact> {
    const [consultation, formalization] = await Promise.all([
      this.consultationProvider.countByDynamicFormId(dynamicFormId),
      this.formalizationProvider.countByDynamicFormId(dynamicFormId),
    ])

    return { consultation, formalization }
  }
}
