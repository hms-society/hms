import { Injectable, Optional } from '@nestjs/common'
import { and, desc, eq, inArray } from 'drizzle-orm'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import {
  DrizzleRepository,
  type DrizzleDatabaseExecutor,
} from '@/shared/database/drizzle/drizzle-repository'

import type { FormalizationSignatureOtpChallengesRepository } from '@hms/core/formalization/interfaces'
import type { FormalizationSignatureOtpChallenge } from '@hms/core/formalization/domain/entities'
import { DrizzleFormalizationSignatureOtpChallengeMapper } from '@/formalization/database/drizzle/mappers'
import { formalizationSignatureOtpChallengeModel } from '@/formalization/database/drizzle/models'
import { encodeSignatureHash } from '@/formalization/database/drizzle/signature-binary'
import { mapSignatureChanges } from './signature-repository-utils'

@Injectable()
export class DrizzleFormalizationSignatureOtpChallengesRepository
  extends DrizzleRepository
  implements FormalizationSignatureOtpChallengesRepository
{
  constructor(
    drizzle: DrizzleClient,
    private readonly mapper: DrizzleFormalizationSignatureOtpChallengeMapper,
    @Optional() databaseOverride?: DrizzleDatabaseExecutor,
  ) {
    super(drizzle, databaseOverride)
  }
  withDatabase(database: DrizzleDatabaseExecutor) {
    return new DrizzleFormalizationSignatureOtpChallengesRepository(
      this.drizzleClient,
      this.mapper,
      database,
    )
  }
  async add(challenge: FormalizationSignatureOtpChallenge) {
    await this.database.insert(formalizationSignatureOtpChallengeModel).values({
      ...challenge,
      codeMac: encodeSignatureHash(challenge.codeMac),
      destinationFingerprint: encodeSignatureHash(challenge.destinationFingerprint),
    })
  }
  async findById(challengeId: string) {
    const [row] = await this.database
      .select()
      .from(formalizationSignatureOtpChallengeModel)
      .where(eq(formalizationSignatureOtpChallengeModel.id, challengeId))
      .limit(1)
    return row ? this.mapper.toDomain(row) : null
  }
  async findCurrentByInvitationId(invitationId: string) {
    const [row] = await this.database
      .select()
      .from(formalizationSignatureOtpChallengeModel)
      .where(
        and(
          eq(formalizationSignatureOtpChallengeModel.invitationId, invitationId),
          inArray(formalizationSignatureOtpChallengeModel.status, [
            'pending_delivery',
            'active',
          ]),
        ),
      )
      .orderBy(desc(formalizationSignatureOtpChallengeModel.generation))
      .limit(1)
    return row ? this.mapper.toDomain(row) : null
  }
  async findLatestByInvitationId(invitationId: string) {
    const [row] = await this.database
      .select()
      .from(formalizationSignatureOtpChallengeModel)
      .where(eq(formalizationSignatureOtpChallengeModel.invitationId, invitationId))
      .orderBy(desc(formalizationSignatureOtpChallengeModel.generation))
      .limit(1)
    return row ? this.mapper.toDomain(row) : null
  }
  async replace(input: { challengeId: string; changes: any }) {
    await this.database
      .update(formalizationSignatureOtpChallengeModel)
      .set(mapSignatureChanges(input.changes))
      .where(eq(formalizationSignatureOtpChallengeModel.id, input.challengeId))
  }
}
