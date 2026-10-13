import type { RefObject } from 'react'

import { Icon } from '@/ui/shared/widgets/components/icon'
import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import type { useCaseTeam } from '../use-case-team'

export type TeamHeaderProps = {
  teamState: ReturnType<typeof useCaseTeam>
  addMemberButtonRef: RefObject<HTMLButtonElement | null>
}

export const TeamHeader = ({ teamState, addMemberButtonRef }: TeamHeaderProps) => (
  <>
    <header className='flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between'>
      <div className='flex min-w-0 items-center gap-3'>
        <span className='flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground'>
          <Icon name='users' className='size-5' />
        </span>
        <div>
          <h2
            id='case-team-title'
            className='font-serif text-lg font-semibold text-foreground'
          >
            Equipe do caso
          </h2>
          <p className='text-sm text-muted-foreground'>
            {teamState.canManageTeam
              ? 'Gerencie quem pode acessar e operar este caso.'
              : 'Integrantes, níveis de acesso e histórico deste caso.'}
          </p>
        </div>
      </div>
      <div className='flex flex-wrap items-center gap-3 sm:justify-end'>
        <Badge variant='secondary' className='rounded-full'>
          {teamState.isLoadingCaseTeam
            ? 'Carregando…'
            : `${teamState.caseTeam?.total ?? 0} pessoas`}
        </Badge>
        {teamState.canManageTeam && (
          <Button
            ref={addMemberButtonRef}
            type='button'
            className='w-full rounded-full sm:w-auto'
            onClick={teamState.handleOpenSelector}
          >
            <Icon name='list-plus' className='size-4' /> Adicionar colaborador
          </Button>
        )}
      </div>
    </header>
    {teamState.isClosed && (
      <p
        className='rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground'
        role='status'
      >
        Caso encerrado: equipe e histórico estão disponíveis somente para consulta.
      </p>
    )}
  </>
)
