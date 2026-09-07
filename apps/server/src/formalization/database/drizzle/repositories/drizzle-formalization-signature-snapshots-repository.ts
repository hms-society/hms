import { Injectable, Optional } from '@nestjs/common'
import { eq } from 'drizzle-orm'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import {
  DrizzleRepository,
  type DrizzleDatabaseExecutor,
} from '@/shared/database/drizzle/drizzle-repository'

import type { FormalizationSignatureSnapshotsRepository } from '@hms/core/formalization/interfaces'
import type { FormalizationSignatureSnapshot } from '@hms/core/formalization/domain/entities'
import { DrizzleFormalizationSignatureSnapshotMapper } from '@/formalization/database/drizzle/mappers'
import { formalizationSignatureSnapshotModel } from '@/formalization/database/drizzle/models'
import { encodeSignatureHash } from '@/formalization/database/drizzle/signature-binary'

@Injectable()
export class DrizzleFormalizationSignatureSnapshotsRepository
  extends DrizzleRepository
  implements FormalizationSignatureSnapshotsRepository
{
  constructor(
    drizzle: DrizzleClient,
    private readonly mapper: DrizzleFormalizationSignatureSnapshotMapper,
    @Optional() databaseOverride?: DrizzleDatabaseExecutor,
  ) {
    super(drizzle, databaseOverride)
  }
  withDatabase(database: DrizzleDatabaseExecutor) {
    return new DrizzleFormalizationSignatureSnapshotsRepository(
      this.drizzleClient,
      this.mapper,
      database,
    )
  }
  async add(snapshot: FormalizationSignatureSnapshot) {
    await this.database.insert(formalizationSignatureSnapshotModel).values({
      id: snapshot.id,
      formalizationId: snapshot.formalizationId,
      formalizationVersion: snapshot.formalizationVersion,
      signatureConfigurationVersion: snapshot.signatureConfigurationVersion,
      snapshotHash: encodeSignatureHash(snapshot.snapshotHash),
      createdBy: snapshot.createdBy,
      createdAt: snapshot.createdAt,
    })
  }
  async findById(snapshotId: string) {
    const [row] = await this.database
      .select()
      .from(formalizationSignatureSnapshotModel)
      .where(eq(formalizationSignatureSnapshotModel.id, snapshotId))
      .limit(1)
    return row ? this.mapper.toDomain(row) : null
  }
  async findByHash(snapshotHash: string) {
    const [row] = await this.database
      .select()
      .from(formalizationSignatureSnapshotModel)
      .where(
        eq(
          formalizationSignatureSnapshotModel.snapshotHash,
          encodeSignatureHash(snapshotHash),
        ),
      )
      .limit(1)
    return row ? this.mapper.toDomain(row) : null
  }
}
