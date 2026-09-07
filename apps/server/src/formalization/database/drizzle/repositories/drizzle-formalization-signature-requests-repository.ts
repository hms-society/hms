import { Injectable, Optional } from '@nestjs/common'
import { and, asc, desc, eq, inArray, notInArray } from 'drizzle-orm'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import {
  DrizzleRepository,
  type DrizzleDatabaseExecutor,
} from '@/shared/database/drizzle/drizzle-repository'

import type { FormalizationSignatureRequestsRepository } from '@hms/core/formalization/interfaces'
import type { FormalizationSignatureRequest } from '@hms/core/formalization/domain/entities'
import { DrizzleFormalizationSignatureRequestMapper } from '@/formalization/database/drizzle/mappers'
import { formalizationSignatureRequestModel } from '@/formalization/database/drizzle/models'
import { encodeSignatureHash } from '@/formalization/database/drizzle/signature-binary'
import {
  mapSignatureChanges,
  withNextSignatureVersion,
} from './signature-repository-utils'

const TERMINAL_SIGNATURE_REQUEST_STATUSES = [
  'confirmed',
  'rejected',
  'cancelled',
  'expired',
  'failed',
] as const

const RECONCILABLE_SIGNATURE_REQUEST_STATUSES = [
  'sent',
  'in_progress',
  'partially_submitted',
  'submitted',
  'reconciliation_required',
] as const

@Injectable()
export class DrizzleFormalizationSignatureRequestsRepository
  extends DrizzleRepository
  implements FormalizationSignatureRequestsRepository
{
  constructor(
    drizzle: DrizzleClient,
    private readonly mapper: DrizzleFormalizationSignatureRequestMapper,
    @Optional() databaseOverride?: DrizzleDatabaseExecutor,
  ) {
    super(drizzle, databaseOverride)
  }
  withDatabase(database: DrizzleDatabaseExecutor) {
    return new DrizzleFormalizationSignatureRequestsRepository(
      this.drizzleClient,
      this.mapper,
      database,
    )
  }
  async add(request: FormalizationSignatureRequest) {
    await this.database.insert(formalizationSignatureRequestModel).values({
      ...request,
      confirmationKeyHash: encodeSignatureHash(request.confirmationKeyHash),
    })
  }
  async listReconcilable(limit: number) {
    const rows = await this.database
      .select()
      .from(formalizationSignatureRequestModel)
      .where(
        inArray(
          formalizationSignatureRequestModel.status,
          RECONCILABLE_SIGNATURE_REQUEST_STATUSES,
        ),
      )
      .orderBy(
        asc(formalizationSignatureRequestModel.updatedAt),
        asc(formalizationSignatureRequestModel.id),
      )
      .limit(limit)
    return rows.map((row) => this.mapper.toDomain(row))
  }
  async findById(requestId: string) {
    return this.findOne(eq(formalizationSignatureRequestModel.id, requestId))
  }
  async findByConfirmationKeyHash(hash: string) {
    return this.findOne(
      eq(
        formalizationSignatureRequestModel.confirmationKeyHash,
        encodeSignatureHash(hash),
      ),
    )
  }
  async findCurrentByFormalizationId(formalizationId: string) {
    return this.findOne(
      and(
        eq(formalizationSignatureRequestModel.formalizationId, formalizationId),
        notInArray(formalizationSignatureRequestModel.status, [
          ...TERMINAL_SIGNATURE_REQUEST_STATUSES,
        ]),
      ),
    )
  }
  async findLatestByFormalizationId(formalizationId: string) {
    const [row] = await this.database
      .select()
      .from(formalizationSignatureRequestModel)
      .where(eq(formalizationSignatureRequestModel.formalizationId, formalizationId))
      .orderBy(
        desc(formalizationSignatureRequestModel.createdAt),
        desc(formalizationSignatureRequestModel.id),
      )
      .limit(1)
    return row ? this.mapper.toDomain(row) : null
  }
  async replace(input: { requestId: string; expectedVersion: number; changes: any }) {
    const [row] = await this.database
      .update(formalizationSignatureRequestModel)
      .set({
        ...mapSignatureChanges(input.changes),
        updatedAt: new Date(),
        version: withNextSignatureVersion(formalizationSignatureRequestModel.version),
      })
      .where(
        and(
          eq(formalizationSignatureRequestModel.id, input.requestId),
          eq(formalizationSignatureRequestModel.version, input.expectedVersion),
        ),
      )
      .returning()
    return row ? !!this.mapper.toDomain(row) : false
  }
  private async findOne(condition: any) {
    const [row] = await this.database
      .select()
      .from(formalizationSignatureRequestModel)
      .where(condition)
      .limit(1)
    return row ? this.mapper.toDomain(row) : null
  }
}
