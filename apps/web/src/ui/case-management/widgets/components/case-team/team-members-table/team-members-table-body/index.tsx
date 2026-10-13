import type { CaseTeam } from '@hms/core/case-management/domain/structures'
import type { CaseTeamMember } from '@hms/core/case-management/domain/structures'
import { TableBody, TableCell, TableRow } from '@/ui/shadcn/table'
import { TeamMemberRow } from '../../team-member-row'

export type TeamMembersTableBodyProps = {
  team?: CaseTeam
  isLoading: boolean
  canManage: boolean
  formatDate: (value: Date | string) => string
  onChangeRole: (member: CaseTeamMember) => void
  onRemove: (member: CaseTeamMember) => void
}

export const TeamMembersTableBody = ({
  team,
  isLoading,
  canManage,
  formatDate,
  onChangeRole,
  onRemove,
}: TeamMembersTableBodyProps) => (
  <TableBody>
    {isLoading ? (
      <TableRow>
        <TableCell colSpan={4} className='py-8 text-center text-muted-foreground'>
          Carregando equipe…
        </TableCell>
      </TableRow>
    ) : (team?.members ?? []).length === 0 ? (
      <TableRow>
        <TableCell colSpan={4} className='py-8 text-center text-muted-foreground'>
          Nenhum integrante vigente foi encontrado.
        </TableCell>
      </TableRow>
    ) : (
      team?.members.map((member) => (
        <TeamMemberRow
          key={member.membershipId}
          member={member}
          activeManagerCount={team?.activeManagerCount ?? 0}
          canManage={canManage}
          formatDate={formatDate}
          onChangeRole={onChangeRole}
          onRemove={onRemove}
        />
      ))
    )}
  </TableBody>
)
