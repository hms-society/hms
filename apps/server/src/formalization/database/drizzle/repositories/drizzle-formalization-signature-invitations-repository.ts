import { Injectable, Optional } from '@nestjs/common'
import { and, desc, eq } from 'drizzle-orm'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import {
  DrizzleRepository,
  type DrizzleDatabaseExecutor,
} from '@/shared/database/drizzle/drizzle-repository'

import type { FormalizationSignatureInvitationsRepository } from '@hms/core/formalization/interfaces'
import type { FormalizationSignatureInvitation } from '@hms/core/formalization/domain/entities'
import { DrizzleFormalizationSignatureInvitationMapper } from '@/formalization/database/drizzle/mappers'
import { formalizationSignatureInvitationModel } from '@/formalization/database/drizzle/models'
import { encodeSignatureHash } from '@/formalization/database/drizzle/signature-binary'
import { mapSignatureChanges } from './signature-repository-utils'

@Injectable()
export class DrizzleFormalizationSignatureInvitationsRepository
  extends DrizzleRepository
  implements FormalizationSignatureInvitationsRepository
{
  constructor(
    drizzle: DrizzleClient,
    private readonly mapper: DrizzleFormalizationSignatureInvitationMapper,
    @Optional() databaseOverride?: DrizzleDatabaseExecutor,
  ) {
    super(drizzle, databaseOverride)
  }
  withDatabase(database: DrizzleDatabaseExecutor) {
    return new DrizzleFormalizationSignatureInvitationsRepository(
      this.drizzleClient,
      this.mapper,
      database,
    )
  }
  async add(invitation: FormalizationSignatureInvitation) {
    await this.database
      .insert(formalizationSignatureInvitationModel)
      .values({ ...invitation, tokenHash: encodeSignatureHash(invitation.tokenHash) })
  }
  async findById(invitationId: string) {
    return this.findOne(eq(formalizationSignatureInvitationModel.id, invitationId))
  }
  async findByTokenHash(tokenHash: string) {
    return this.findOne(
      eq(formalizationSignatureInvitationModel.tokenHash, encodeSignatureHash(tokenHash)),
    )
  }
  async findActiveByRecipientId(recipientId: string) {
    return this.findOne(
      and(
        eq(formalizationSignatureInvitationModel.recipientId, recipientId),
        eq(formalizationSignatureInvitationModel.status, 'active'),
      ),
    )
  }
  async findConsumedByRecipientAndRequest(input: {
    recipientId: string
    requestId: string
  }) {
    const [row] = await this.database
      .select()
      .from(formalizationSignatureInvitationModel)
      .where(
        and(
          eq(formalizationSignatureInvitationModel.recipientId, input.recipientId),
          eq(formalizationSignatureInvitationModel.requestId, input.requestId),
          eq(formalizationSignatureInvitationModel.status, 'consumed'),
        ),
      )
      .orderBy(
        desc(formalizationSignatureInvitationModel.generation),
        desc(formalizationSignatureInvitationModel.createdAt),
        desc(formalizationSignatureInvitationModel.id),
      )
      .limit(1)

    return row ? this.mapper.toDomain(row) : null
  }
  async replace(input: { invitationId: string; changes: any }) {
    await this.database
      .update(formalizationSignatureInvitationModel)
      .set(mapSignatureChanges(input.changes))
      .where(eq(formalizationSignatureInvitationModel.id, input.invitationId))
  }
  private async findOne(condition: any) {
    const [row] = await this.database
      .select()
      .from(formalizationSignatureInvitationModel)
      .where(condition)
      .limit(1)
    return row ? this.mapper.toDomain(row) : null
  }
}
