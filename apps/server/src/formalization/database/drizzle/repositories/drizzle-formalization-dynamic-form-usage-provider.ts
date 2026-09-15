import { Inject, Injectable } from '@nestjs/common'
import type { FormalizationDynamicFormUsageProvider } from '@hms/core/formalization/interfaces'
import type { DynamicFormUsageCount } from '@hms/core/legal-catalog/domain/structures'
import { and, count, eq } from 'drizzle-orm'

import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'
import { formalizationModel } from '@/formalization/database/drizzle/models'

@Injectable()
export class DrizzleFormalizationDynamicFormUsageProvider
  extends DrizzleRepository
  implements FormalizationDynamicFormUsageProvider
{
  constructor(@Inject(DrizzleClient) drizzle: DrizzleClient) {
    super(drizzle)
  }

  async countByDynamicFormId(dynamicFormId: string): Promise<DynamicFormUsageCount> {
    const [{ total }] = await this.database
      .select({ total: count() })
      .from(formalizationModel)
      .where(eq(formalizationModel.contractFormId, dynamicFormId))
    const [{ total: inProgress }] = await this.database
      .select({ total: count() })
      .from(formalizationModel)
      .where(
        and(
          eq(formalizationModel.contractFormId, dynamicFormId),
          eq(formalizationModel.status, 'in_progress'),
        ),
      )

    return { total: Number(total), inProgress: Number(inProgress) }
  }
}
