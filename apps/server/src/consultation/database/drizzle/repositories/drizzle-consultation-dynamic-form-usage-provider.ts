import { Inject, Injectable } from '@nestjs/common'
import type { ConsultationDynamicFormUsageProvider } from '@hms/core/consultation/interfaces'
import type { DynamicFormUsageCount } from '@hms/core/legal-catalog/domain/structures'
import { and, count, eq } from 'drizzle-orm'

import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'
import { consultationModel } from '@/consultation/database/drizzle/models'

@Injectable()
export class DrizzleConsultationDynamicFormUsageProvider
  extends DrizzleRepository
  implements ConsultationDynamicFormUsageProvider
{
  constructor(@Inject(DrizzleClient) drizzle: DrizzleClient) {
    super(drizzle)
  }

  async countByDynamicFormId(dynamicFormId: string): Promise<DynamicFormUsageCount> {
    const [{ total }] = await this.database
      .select({ total: count() })
      .from(consultationModel)
      .where(eq(consultationModel.dynamicFormId, dynamicFormId))
    const [{ total: inProgress }] = await this.database
      .select({ total: count() })
      .from(consultationModel)
      .where(
        and(
          eq(consultationModel.dynamicFormId, dynamicFormId),
          eq(consultationModel.status, 'pending'),
        ),
      )

    return { total: Number(total), inProgress: Number(inProgress) }
  }
}
