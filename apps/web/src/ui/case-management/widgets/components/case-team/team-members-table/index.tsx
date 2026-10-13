import type { CaseTeam } from '@hms/core/case-management/domain/structures'
import { Table, TableHead, TableHeader, TableRow } from '@/ui/shadcn/table'
import { TeamMembersTableBody } from './team-members-table-body'
import type { TeamMembersTableBodyProps } from './team-members-table-body'

export type TeamMembersTableProps = Omit<TeamMembersTableBodyProps, 'team'> & {
  team?: CaseTeam
}

export const TeamMembersTable = ({ team, ...bodyProps }: TeamMembersTableProps) => (
  <section
    className='max-w-full overflow-x-auto'
    aria-label='Tabela da equipe; role horizontalmente para ver todas as colunas'
  >
    <Table className='min-w-[620px]'>
      <TableHeader className='bg-secondary text-secondary-foreground'>
        <TableRow>
          <TableHead className='w-[52%]'>Colaborador</TableHead>
          <TableHead>Nível de acesso</TableHead>
          <TableHead>Entrada no caso</TableHead>
          <TableHead className='w-12'>
            <span className='sr-only'>Ações</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TeamMembersTableBody team={team} {...bodyProps} />
    </Table>
  </section>
)
