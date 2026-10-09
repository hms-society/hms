import { Inject, Injectable, Optional } from '@nestjs/common'
import type { CaseMembersRepository } from '@hms/core/case-management/interfaces'
import { and, eq, inArray, isNull } from 'drizzle-orm'

import { DrizzleCaseMemberMapper } from '@/case-management/database/drizzle/mappers'
import { caseMemberModel } from '@/case-management/database/drizzle/models'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'
import type { Database } from '@/shared/database/drizzle/drizzle-client'

type CaseManagementDatabaseExecutor = Parameters<
  Parameters<Database['transaction']>[0]
>[0]

@Injectable()
export class DrizzleCaseMembersRepository
  extends DrizzleRepository
  implements CaseMembersRepository
{
  constructor(
    drizzle: DrizzleClient,
    @Inject(DrizzleCaseMemberMapper)
    private readonly caseMemberMapper: DrizzleCaseMemberMapper,
    @Optional() private readonly executor?: CaseManagementDatabaseExecutor,
  ) {
    super(drizzle)
  }

  protected get database() {
    return this.executor ?? this.drizzleClient.requireDatabase()
  }

  async findByCaseAndCollaborator(caseId: string, collaboratorId: string) {
    const [member] = await this.database
      .select()
      .from(caseMemberModel)
      .where(
        and(
          eq(caseMemberModel.caseId, caseId),
          eq(caseMemberModel.collaboratorId, collaboratorId),
        ),
      )
      .limit(1)
    return member ? this.caseMemberMapper.toDomain(member) : undefined
  }

  async listByCaseId(caseId: string) {
    const members = await this.database
      .select()
      .from(caseMemberModel)
      .where(eq(caseMemberModel.caseId, caseId))
    return members.map((member) => this.caseMemberMapper.toDomain(member))
  }

  async listByCollaboratorId(collaboratorId: string) {
    const members = await this.database
      .select()
      .from(caseMemberModel)
      .where(eq(caseMemberModel.collaboratorId, collaboratorId))
    return members.map((member) => this.caseMemberMapper.toDomain(member))
  }

  async replace(
    membershipId: string,
    changes: Parameters<CaseMembersRepository['replace']>[1],
  ) {
    const [member] = await this.database
      .update(caseMemberModel)
      .set({
        ...changes,
        removedAt: changes.removedAt ?? null,
        removedBy: changes.removedBy ?? null,
      })
      .where(eq(caseMemberModel.id, membershipId))
      .returning()
    if (!member) throw new Error('Case member disappeared while updating.')
    return this.caseMemberMapper.toDomain(member)
  }

  async addMany(
    caseMembers: Parameters<CaseMembersRepository['addMany']>[0],
  ): ReturnType<CaseMembersRepository['addMany']> {
    if (caseMembers.length === 0) return []

    const createdCaseMembers = await this.database
      .insert(caseMemberModel)
      .values([...caseMembers])
      .returning()

    return createdCaseMembers.map((caseMember) =>
      this.caseMemberMapper.toDomain(caseMember),
    )
  }

  async findActiveCollaboratorIdsByCaseId(
    caseId: string,
    collaboratorIds: readonly string[],
  ) {
    const records = await this.database
      .select({ collaboratorId: caseMemberModel.collaboratorId })
      .from(caseMemberModel)
      .where(
        and(
          eq(caseMemberModel.caseId, caseId),
          isNull(caseMemberModel.removedAt),
          eq(caseMemberModel.archivedLegacy, false),
          ...(collaboratorIds.length > 0
            ? [inArray(caseMemberModel.collaboratorId, [...collaboratorIds])]
            : []),
        ),
      )

    return records.map((record) => record.collaboratorId)
  }

  async removeAll(): Promise<void> {
    await this.database.delete(caseMemberModel)
  }
}
