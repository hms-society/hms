import { Injectable, Optional } from '@nestjs/common'
import { and, eq, gte, lt, sql } from 'drizzle-orm'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import {
  DrizzleRepository,
  type DrizzleDatabaseExecutor,
} from '@/shared/database/drizzle/drizzle-repository'

import type { FormalizationSignatureOtpRateReservationsRepository } from '@hms/core/formalization/interfaces'
import type { FormalizationSignatureOtpRateReservation } from '@hms/core/formalization/domain/entities'
import { DrizzleFormalizationSignatureOtpRateReservationMapper } from '@/formalization/database/drizzle/mappers'
import { formalizationSignatureOtpRateReservationModel } from '@/formalization/database/drizzle/models'
import { encodeSignatureHash } from '@/formalization/database/drizzle/signature-binary'

@Injectable()
export class DrizzleFormalizationSignatureOtpRateReservationsRepository
  extends DrizzleRepository
  implements FormalizationSignatureOtpRateReservationsRepository
{
  constructor(
    drizzle: DrizzleClient,
    private readonly mapper: DrizzleFormalizationSignatureOtpRateReservationMapper,
    @Optional() databaseOverride?: DrizzleDatabaseExecutor,
  ) {
    super(drizzle, databaseOverride)
  }
  withDatabase(database: DrizzleDatabaseExecutor) {
    return new DrizzleFormalizationSignatureOtpRateReservationsRepository(
      this.drizzleClient,
      this.mapper,
      database,
    )
  }
  async add(reservation: FormalizationSignatureOtpRateReservation) {
    await this.database.insert(formalizationSignatureOtpRateReservationModel).values({
      ...reservation,
      sourceIpHash: encodeSignatureHash(reservation.sourceIpHash),
    })
  }
  async countByInvitationIdSince(invitationId: string, since: Date) {
    const result = await this.database
      .select({ count: sql<number>`count(*)` })
      .from(formalizationSignatureOtpRateReservationModel)
      .where(
        and(
          eq(formalizationSignatureOtpRateReservationModel.invitationId, invitationId),
          gte(formalizationSignatureOtpRateReservationModel.reservedAt, since),
        ),
      )
    return Number(result[0]?.count ?? 0)
  }
  async countBySourceIpHashSince(sourceIpHash: string, since: Date) {
    const result = await this.database
      .select({ count: sql<number>`count(*)` })
      .from(formalizationSignatureOtpRateReservationModel)
      .where(
        and(
          eq(
            formalizationSignatureOtpRateReservationModel.sourceIpHash,
            encodeSignatureHash(sourceIpHash),
          ),
          gte(formalizationSignatureOtpRateReservationModel.reservedAt, since),
        ),
      )
    return Number(result[0]?.count ?? 0)
  }
  async removeAllExpired(before: Date) {
    const rows = await this.database
      .delete(formalizationSignatureOtpRateReservationModel)
      .where(lt(formalizationSignatureOtpRateReservationModel.reservedAt, before))
      .returning({ id: formalizationSignatureOtpRateReservationModel.id })
    return rows.length
  }
}
