import { Badge } from '@/ui/shadcn/badge'
import type { useCaseTeam } from '../use-case-team'
import { TeamAccessLegend } from '../team-access-legend'
import { TeamMembersTable } from '../team-members-table'

export type TeamMembersPanelProps = {
  teamState: ReturnType<typeof useCaseTeam>
}

export const TeamMembersPanel = ({ teamState }: TeamMembersPanelProps) => (
  <div className='grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_280px]'>
    <section className='min-w-0 overflow-hidden rounded-xl border border-border bg-card'>
      <header className='flex items-center justify-between gap-3 border-b border-border px-4 py-3'>
        <div>
          <h3 className='font-serif text-base font-semibold text-foreground'>
            Pessoas com acesso
          </h3>
          <p className='text-xs text-muted-foreground'>Integrantes ativos neste caso.</p>
        </div>
        <Badge variant='secondary' className='rounded-full'>
          {teamState.caseTeam?.total ?? 0} ativas
        </Badge>
      </header>
      <TeamMembersTable
        team={teamState.caseTeam ?? undefined}
        isLoading={teamState.isLoadingCaseTeam}
        canManage={teamState.canManageTeam}
        formatDate={teamState.formatDate}
        onChangeRole={teamState.handleBeginRoleChange}
        onRemove={teamState.handleBeginRemoval}
      />
    </section>
    <TeamAccessLegend />
  </div>
)
