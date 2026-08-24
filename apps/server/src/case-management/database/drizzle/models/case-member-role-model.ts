import { CaseMemberRole } from '@hms/core/case-management/domain/structures'
import { pgEnum } from 'drizzle-orm/pg-core'

export const caseMemberRoleModel = pgEnum('case_member_role', [
  CaseMemberRole.LeadLawyer,
  CaseMemberRole.Lawyer,
  CaseMemberRole.Paralegal,
  CaseMemberRole.Supervisor,
])
