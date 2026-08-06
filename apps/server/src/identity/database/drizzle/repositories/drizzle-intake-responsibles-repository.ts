import { Inject, Injectable, Optional } from '@nestjs/common'
import type { ResponsibleListProjection } from '@hms/core/identity/domain/structures'
import type { IntakeResponsiblesRepository } from '@hms/core/identity/interfaces'
import { asc, eq, inArray } from 'drizzle-orm'

import { collaboratorModel, userModel } from '@/identity/database/drizzle/models'
import {
  DrizzleIdentityRepository,
  type IdentityDatabaseExecutor,
} from '@/identity/database/drizzle/repositories/drizzle-identity-repository'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'

@Injectable()
export class DrizzleIntakeResponsiblesRepository
  extends DrizzleIdentityRepository
  implements IntakeResponsiblesRepository
{
  constructor(
    @Inject(DrizzleClient) drizzle: DrizzleClient,
    @Optional()
    databaseOverride?: IdentityDatabaseExecutor,
  ) {
    super(drizzle, databaseOverride)
  }

  async findResponsiblesByIds(
    responsibleIds: readonly string[],
  ): Promise<readonly ResponsibleListProjection[]> {
    if (responsibleIds.length === 0) return []

    return this.database
      .select({
        responsibleId: collaboratorModel.id,
        professionalName: collaboratorModel.professionalName,
      })
      .from(collaboratorModel)
      .innerJoin(userModel, eq(userModel.id, collaboratorModel.userId))
      .where(inArray(collaboratorModel.id, responsibleIds))
      .orderBy(asc(collaboratorModel.id))
  }

  async listResponsibleOptions(): Promise<readonly ResponsibleListProjection[]> {
    return this.database
      .select({
        responsibleId: collaboratorModel.id,
        professionalName: collaboratorModel.professionalName,
      })
      .from(collaboratorModel)
      .innerJoin(userModel, eq(userModel.id, collaboratorModel.userId))
      .where(eq(userModel.status, 'active'))
      .orderBy(asc(collaboratorModel.professionalName), asc(collaboratorModel.id))
  }
}
