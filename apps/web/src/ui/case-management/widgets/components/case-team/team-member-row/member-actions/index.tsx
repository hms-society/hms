import { CaseMemberRole } from '@hms/core/case-management/domain/structures'
import type { CaseTeamMember } from '@hms/core/case-management/domain/structures'
import { Link } from '@tanstack/react-router'

import { Icon } from '@/ui/shared/widgets/components/icon'
import { Button } from '@/ui/shadcn/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/ui/shadcn/dropdown-menu'

export type MemberActionsProps = {
  member: CaseTeamMember
  canManage: boolean
  isLastManager: boolean
  onChangeRole: () => void
  onRemove: () => void
}

export const MemberActions = ({
  member,
  canManage,
  isLastManager,
  onChangeRole,
  onRemove,
}: MemberActionsProps) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button
        type='button'
        variant='ghost'
        size='icon-sm'
        className='rounded-full'
        aria-label={`Ações para ${member.professionalName}`}
      >
        <Icon name='ellipsis' className='size-4' />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent side='top' align='end' collisionPadding={8}>
      <DropdownMenuItem asChild>
        <Link
          to='/colaboradores/$colaboradorId'
          params={{ colaboradorId: member.collaboratorId }}
        >
          <Icon name='user' className='size-4' /> Ver perfil
        </Link>
      </DropdownMenuItem>
      {canManage && member.isEligible && (
        <>
          <DropdownMenuItem disabled={isLastManager} onSelect={onChangeRole}>
            <Icon name='shield-check' className='size-4' />
            Alterar para{' '}
            {member.role === CaseMemberRole.Manager ? 'Colaborador' : 'Gestor'}
          </DropdownMenuItem>
          {isLastManager && (
            <p className='px-2 py-1 text-xs text-muted-foreground'>
              Pelo menos uma pessoa deve permanecer como Gestora.
            </p>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={isLastManager}
            onSelect={onRemove}
            className='text-destructive focus:text-destructive'
          >
            <Icon name='user-x' className='size-4' /> Remover do caso
          </DropdownMenuItem>
        </>
      )}
    </DropdownMenuContent>
  </DropdownMenu>
)
