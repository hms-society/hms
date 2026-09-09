import { Injectable, Optional } from '@nestjs/common'
import { and, eq } from 'drizzle-orm'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import {
  DrizzleRepository,
  type DrizzleDatabaseExecutor,
} from '@/shared/database/drizzle/drizzle-repository'

import type { FormalizationSignatureProtocolsRepository } from '@hms/core/formalization/interfaces'
import type { FormalizationSignatureProtocol } from '@hms/core/formalization/domain/entities'
import { DrizzleFormalizationSignatureProtocolMapper } from '@/formalization/database/drizzle/mappers'
import { formalizationSignatureProtocolModel } from '@/formalization/database/drizzle/models'
import { encodeSignatureHash } from '@/formalization/database/drizzle/signature-binary'

@Injectable()
export class DrizzleFormalizationSignatureProtocolsRepository
  extends DrizzleRepository
  implements FormalizationSignatureProtocolsRepository
{
  constructor(
    drizzle: DrizzleClient,
    private readonly mapper: DrizzleFormalizationSignatureProtocolMapper,
    @Optional() databaseOverride?: DrizzleDatabaseExecutor,
  ) {
    super(drizzle, databaseOverride)
  }
  withDatabase(database: DrizzleDatabaseExecutor) {
    return new DrizzleFormalizationSignatureProtocolsRepository(
      this.drizzleClient,
      this.mapper,
      database,
    )
  }
  async add(protocol: FormalizationSignatureProtocol) {
    await this.database.insert(formalizationSignatureProtocolModel).values({
      ...protocol,
      artifactSetHash: encodeSignatureHash(protocol.artifactSetHash),
      createdAt: new Date(),
    })
  }
  async findByRecipientAndRequest(input: { recipientId: string; requestId: string }) {
    const [row] = await this.database
      .select()
      .from(formalizationSignatureProtocolModel)
      .where(
        and(
          eq(formalizationSignatureProtocolModel.recipientId, input.recipientId),
          eq(formalizationSignatureProtocolModel.requestId, input.requestId),
        ),
      )
      .limit(1)
    return row ? this.mapper.toDomain(row) : null
  }
}
