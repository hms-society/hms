import { Injectable, Optional } from '@nestjs/common'
import { and, eq } from 'drizzle-orm'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import {
  DrizzleRepository,
  type DrizzleDatabaseExecutor,
} from '@/shared/database/drizzle/drizzle-repository'

import type { FormalizationSignatureGatewaySessionsRepository } from '@hms/core/formalization/interfaces'
import type { FormalizationSignatureGatewaySession } from '@hms/core/formalization/domain/entities'
import { DrizzleFormalizationSignatureGatewaySessionMapper } from '@/formalization/database/drizzle/mappers'
import { formalizationSignatureGatewaySessionModel } from '@/formalization/database/drizzle/models'
import { encodeSignatureHash } from '@/formalization/database/drizzle/signature-binary'
import {
  mapSignatureChanges,
  withNextSignatureVersion,
} from './signature-repository-utils'

@Injectable()
export class DrizzleFormalizationSignatureGatewaySessionsRepository
  extends DrizzleRepository
  implements FormalizationSignatureGatewaySessionsRepository
{
  constructor(
    drizzle: DrizzleClient,
    private readonly mapper: DrizzleFormalizationSignatureGatewaySessionMapper,
    @Optional() databaseOverride?: DrizzleDatabaseExecutor,
  ) {
    super(drizzle, databaseOverride)
  }
  withDatabase(database: DrizzleDatabaseExecutor) {
    return new DrizzleFormalizationSignatureGatewaySessionsRepository(
      this.drizzleClient,
      this.mapper,
      database,
    )
  }
  async add(session: FormalizationSignatureGatewaySession) {
    await this.database.insert(formalizationSignatureGatewaySessionModel).values({
      ...session,
      tokenHash: encodeSignatureHash(session.tokenHash),
      deviceSecretHash: encodeSignatureHash(session.deviceSecretHash),
      csrfHash: encodeSignatureHash(session.csrfHash),
    })
  }
  async findByTokenHash(tokenHash: string) {
    const [row] = await this.database
      .select()
      .from(formalizationSignatureGatewaySessionModel)
      .where(
        eq(
          formalizationSignatureGatewaySessionModel.tokenHash,
          encodeSignatureHash(tokenHash),
        ),
      )
      .limit(1)
    return row ? this.mapper.toDomain(row) : null
  }
  async findActiveByRecipientId(recipientId: string) {
    const rows = await this.database
      .select()
      .from(formalizationSignatureGatewaySessionModel)
      .where(
        and(
          eq(formalizationSignatureGatewaySessionModel.recipientId, recipientId),
          eq(formalizationSignatureGatewaySessionModel.status, 'active'),
        ),
      )
    return rows.map((row) => this.mapper.toDomain(row))
  }
  async replace(input: { sessionId: string; expectedVersion: number; changes: any }) {
    const values = mapSignatureChanges(input.changes)
    if (values.tokenHash)
      values.tokenHash = encodeSignatureHash(values.tokenHash as string)
    if (values.csrfHash) values.csrfHash = encodeSignatureHash(values.csrfHash as string)
    const [row] = await this.database
      .update(formalizationSignatureGatewaySessionModel)
      .set({
        ...values,
        version: withNextSignatureVersion(
          formalizationSignatureGatewaySessionModel.version,
        ),
      })
      .where(
        and(
          eq(formalizationSignatureGatewaySessionModel.id, input.sessionId),
          eq(formalizationSignatureGatewaySessionModel.version, input.expectedVersion),
        ),
      )
      .returning()
    return !!row
  }
}
