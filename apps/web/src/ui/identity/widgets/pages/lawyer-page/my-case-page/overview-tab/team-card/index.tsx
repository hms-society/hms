import { CaseMemberRole } from '@hms/core/case-management/domain/structures'
import { Avatar, AvatarFallback } from '@/ui/shadcn/avatar'
import { Button } from '@/ui/shadcn/button'
import type { CaseTeamMember } from '../../types'

export type TeamCardProps = { team: CaseTeamMember[] }

export const TeamCard = ({ team }: TeamCardProps) => (
  <section className='flex flex-col gap-3 rounded-lg border border-border bg-secondary p-4 shadow-xs'>
    <div className='flex items-center justify-between'>
      <h2 className='font-serif text-[16px] font-semibold text-foreground'>
        Equipe do Caso
      </h2>
      <Button variant='link' size='xs' className='h-auto px-0 text-primary'>
        Editar
      </Button>
    </div>
    <div className='flex flex-col gap-2'>
      {team.map((member) => (
        <div
          key={member.collaboratorId}
          className='flex items-center gap-3 rounded-md p-2'
        >
          <Avatar className='size-9'>
            <AvatarFallback className='bg-teal-700 text-white text-[12px]'>
              {member.name?.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className='min-w-0 flex-1'>
            <p className='truncate text-[14px] font-semibold text-foreground'>
              {member.name}
            </p>
            <p className='truncate text-[14px] text-muted-foreground'>
              {member.role === CaseMemberRole.Manager ? 'Gestor' : 'Colaborador'}
            </p>
          </div>
        </div>
      ))}
    </div>
  </section>
)
