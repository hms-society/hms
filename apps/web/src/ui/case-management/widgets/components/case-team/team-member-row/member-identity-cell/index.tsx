import type { CaseTeamMember } from '@hms/core/case-management/domain/structures'
import { Avatar, AvatarFallback } from '@/ui/shadcn/avatar'

export type MemberIdentityCellProps = { member: CaseTeamMember }

export const MemberIdentityCell = ({ member }: MemberIdentityCellProps) => (
  <div className='flex min-w-0 items-center gap-3'>
    <Avatar className='size-9 rounded-full'>
      <AvatarFallback className='rounded-full bg-secondary text-secondary-foreground'>
        {member.professionalName.slice(0, 2).toUpperCase()}
      </AvatarFallback>
    </Avatar>
    <div className='min-w-0'>
      <p className='truncate text-sm font-medium text-foreground'>
        {member.professionalName}
      </p>
      <p className='break-all text-xs text-muted-foreground'>{member.email}</p>
      {!member.isEligible && (
        <p className='text-xs text-destructive'>Perfil ou status não elegível</p>
      )}
    </div>
  </div>
)
