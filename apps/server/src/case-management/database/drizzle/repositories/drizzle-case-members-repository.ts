import { Inject, Injectable } from '@nestjs/common'
import type { CaseMembersRepository } from '@hms/core/case-management/interfaces'

import { DrizzleCaseMemberMapper } from '@/case-management/database/drizzle/mappers'
import { caseMemberModel } from '@/case-management/database/drizzle/models'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'

@Injectable()
export class DrizzleCaseMembersRepository
  extends DrizzleRepository
  implements CaseMembersRepository
{
  constructor(
    drizzle: DrizzleClient,
    @Inject(DrizzleCaseMemberMapper)
    private readonly caseMemberMapper: DrizzleCaseMemberMapper,
  ) {
    super(drizzle)
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

  async removeAll(): Promise<void> {
    await this.database.delete(caseMemberModel)
  }
}
