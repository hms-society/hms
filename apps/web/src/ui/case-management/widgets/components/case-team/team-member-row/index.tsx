import { CaseMemberRole } from '@hms/core/case-management/domain/structures'
import type { CaseTeamMember } from '@hms/core/case-management/domain/structures'
import { TableCell, TableRow } from '@/ui/shadcn/table'

import { MemberActions } from './member-actions'
import { MemberIdentityCell } from './member-identity-cell'
import { MemberRoleCell } from './member-role-cell'

export type TeamMemberRowProps = {
  member: CaseTeamMember
  activeManagerCount: number
  canManage: boolean
  formatDate: (value: Date | string) => string
  onChangeRole: (member: CaseTeamMember) => void
  onRemove: (member: CaseTeamMember) => void
}

export const TeamMemberRow = ({
  member,
  activeManagerCount,
  canManage,
  formatDate,
  onChangeRole,
  onRemove,
}: TeamMemberRowProps) => {
  const isLastManager = member.role === CaseMemberRole.Manager && activeManagerCount === 1

  return (
    <TableRow>
      <TableCell>
        <MemberIdentityCell member={member} />
      </TableCell>
      <TableCell>
        <MemberRoleCell role={member.role} isLastManager={isLastManager} />
      </TableCell>
      <TableCell className='whitespace-nowrap text-sm text-muted-foreground'>
        {formatDate(member.assignedAt)}
      </TableCell>
      <TableCell>
        <MemberActions
          member={member}
          canManage={canManage}
          isLastManager={isLastManager}
          onChangeRole={() => onChangeRole(member)}
          onRemove={() => onRemove(member)}
        />
      </TableCell>
    </TableRow>
  )
}
