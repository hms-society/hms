import { CaseMemberRole } from '@hms/core/case-management/domain/structures'
import { Badge } from '@/ui/shadcn/badge'

export type MemberRoleCellProps = {
  role: CaseMemberRole
  isLastManager: boolean
}

export const MemberRoleCell = ({ role, isLastManager }: MemberRoleCellProps) => (
  <>
    <Badge
      variant={role === CaseMemberRole.Manager ? 'outline' : 'secondary'}
      className={
        role === CaseMemberRole.Manager
          ? 'rounded-full bg-highlight text-highlight-foreground'
          : 'rounded-full'
      }
    >
      {role === CaseMemberRole.Manager ? 'Gestor' : 'Colaborador'}
    </Badge>
    {isLastManager && (
      <p className='mt-1 max-w-40 text-xs text-muted-foreground'>Último Gestor ativo</p>
    )}
  </>
)
