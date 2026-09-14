import { Inject, Injectable } from '@nestjs/common'
import type { DynamicFormAdministrationAuditEntry } from '@hms/core/legal-catalog/domain/entities'
import type { DynamicFormAdministrationAuditRepository } from '@hms/core/legal-catalog/interfaces'

import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'
import { dynamicFormAdministrationAuditModel } from '@/legal-catalog/database/drizzle/models'

@Injectable()
export class DrizzleDynamicFormAdministrationAuditRepository
  extends DrizzleRepository
  implements DynamicFormAdministrationAuditRepository
{
  async add(entry: DynamicFormAdministrationAuditEntry): Promise<void> {
    await this.database.insert(dynamicFormAdministrationAuditModel).values({
      id: entry.id,
      dynamicFormId: entry.dynamicFormId,
      actorCollaboratorId: entry.actorCollaboratorId,
      action: entry.action,
      occurredAt: entry.occurredAt,
      operationKey: entry.operationKey,
      details: entry.details,
    })
  }

  constructor(@Inject(DrizzleClient) drizzle: DrizzleClient) {
    super(drizzle)
  }
}
