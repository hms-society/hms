import { CaseMemberRole } from '@hms/core/case-management/domain/structures'
import { Label } from '@/ui/shadcn/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/shadcn/select'

export type CandidateRoleSelectProps = {
  role: CaseMemberRole
  allowedRoles: readonly CaseMemberRole[]
  onChange: (role: string) => void
}

export const CandidateRoleSelect = ({
  role,
  allowedRoles,
  onChange,
}: CandidateRoleSelectProps) => (
  <div className='space-y-2'>
    <Label htmlFor='team-member-role'>Nível na equipe</Label>
    <Select value={role} onValueChange={onChange}>
      <SelectTrigger id='team-member-role' className='w-full'>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {allowedRoles.includes(CaseMemberRole.Collaborator) && (
          <SelectItem value={CaseMemberRole.Collaborator}>Colaborador</SelectItem>
        )}
        {allowedRoles.includes(CaseMemberRole.Manager) && (
          <SelectItem value={CaseMemberRole.Manager}>Gestor</SelectItem>
        )}
      </SelectContent>
    </Select>
  </div>
)
