import { CaseMemberRole } from '@hms/core/case-management/domain/structures'
import type { CaseEligibleCollaborator } from '@hms/core/case-management/domain/structures'
import { Avatar, AvatarFallback } from '@/ui/shadcn/avatar'
import { Button } from '@/ui/shadcn/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/shadcn/select'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type TeamRosterMemberProps = {
  role: CaseMemberRole
  member?: CaseEligibleCollaborator
  onRoleChange: (role: CaseMemberRole) => void
  onRemove: () => void
}

export const TeamRosterMember = ({
  role,
  member,
  onRoleChange,
  onRemove,
}: TeamRosterMemberProps) => (
  <div className='flex flex-col gap-3 rounded-xl border border-border p-3 sm:flex-row sm:items-center'>
    <div className='flex min-w-0 flex-1 items-center gap-3'>
      <Avatar className='size-9'>
        <AvatarFallback>
          {member?.professionalName.slice(0, 2).toUpperCase() ?? 'CO'}
        </AvatarFallback>
      </Avatar>
      <div className='min-w-0'>
        <p className='truncate text-sm font-medium'>
          {member?.professionalName ?? 'Colaborador'}
        </p>
        <p className='truncate text-xs text-muted-foreground'>{member?.email}</p>
      </div>
    </div>
    <Select value={role} onValueChange={(value) => onRoleChange(value as CaseMemberRole)}>
      <SelectTrigger className='w-full sm:w-40'>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={CaseMemberRole.Collaborator}>Colaborador</SelectItem>
        <SelectItem value={CaseMemberRole.Manager}>Gestor</SelectItem>
      </SelectContent>
    </Select>
    <Button
      type='button'
      variant='outline'
      className='w-full rounded-full text-destructive sm:w-auto'
      onClick={onRemove}
      aria-label={`Remover ${member?.professionalName ?? 'colaborador'}`}
    >
      <Icon name='trash-2' className='mr-2 size-4' /> Remover
    </Button>
  </div>
)
