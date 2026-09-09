import { Injectable, Optional } from '@nestjs/common'
import { eq } from 'drizzle-orm'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import {
  DrizzleRepository,
  type DrizzleDatabaseExecutor,
} from '@/shared/database/drizzle/drizzle-repository'

import type { FormalizationSignatureOtpGuardsRepository } from '@hms/core/formalization/interfaces'
import type { FormalizationSignatureOtpGuard } from '@hms/core/formalization/domain/structures'
import { DrizzleFormalizationSignatureOtpGuardMapper } from '@/formalization/database/drizzle/mappers'
import { formalizationSignatureOtpGuardModel } from '@/formalization/database/drizzle/models'
import {
  mapSignatureChanges,
  withNextSignatureVersion,
} from './signature-repository-utils'

@Injectable()
export class DrizzleFormalizationSignatureOtpGuardsRepository
  extends DrizzleRepository
  implements FormalizationSignatureOtpGuardsRepository
{
  constructor(
    drizzle: DrizzleClient,
    private readonly mapper: DrizzleFormalizationSignatureOtpGuardMapper,
    @Optional() databaseOverride?: DrizzleDatabaseExecutor,
  ) {
    super(drizzle, databaseOverride)
  }
  withDatabase(database: DrizzleDatabaseExecutor) {
    return new DrizzleFormalizationSignatureOtpGuardsRepository(
      this.drizzleClient,
      this.mapper,
      database,
    )
  }
  async add(guard: FormalizationSignatureOtpGuard) {
    await this.database.insert(formalizationSignatureOtpGuardModel).values(guard)
  }
  async findByInvitationId(invitationId: string) {
    const [row] = await this.database
      .select()
      .from(formalizationSignatureOtpGuardModel)
      .where(eq(formalizationSignatureOtpGuardModel.invitationId, invitationId))
      .limit(1)
    return row ? this.mapper.toDomain(row) : null
  }
  async replace(input: { invitationId: string; changes: any }) {
    await this.database
      .update(formalizationSignatureOtpGuardModel)
      .set({
        ...mapSignatureChanges(input.changes),
        version: withNextSignatureVersion(formalizationSignatureOtpGuardModel.version),
      })
      .where(eq(formalizationSignatureOtpGuardModel.invitationId, input.invitationId))
  }
}
