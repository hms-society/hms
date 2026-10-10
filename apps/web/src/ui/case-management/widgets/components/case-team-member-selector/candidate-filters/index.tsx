import { CollaboratorProfile } from '@hms/core/identity/domain/structures'
import { Label } from '@/ui/shadcn/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/shadcn/select'

export type CandidateFiltersProps = {
  profile: CollaboratorProfile | 'all'
  requiredProfile?: CollaboratorProfile
  onProfileChange: (profile: string) => void
}

export const CandidateFilters = ({
  profile,
  requiredProfile,
  onProfileChange,
}: CandidateFiltersProps) => (
  <div className='space-y-2'>
    <Label htmlFor='team-candidate-profile'>Perfil</Label>
    <Select
      value={requiredProfile ?? profile}
      onValueChange={onProfileChange}
      disabled={Boolean(requiredProfile)}
    >
      <SelectTrigger id='team-candidate-profile' className='w-full'>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value='all'>Todos os perfis jurídicos</SelectItem>
        <SelectItem value={CollaboratorProfile.Lawyer}>Advogado</SelectItem>
        <SelectItem value={CollaboratorProfile.Paralegal}>Paralegal</SelectItem>
        <SelectItem value={CollaboratorProfile.Supervisor}>Supervisor</SelectItem>
      </SelectContent>
    </Select>
  </div>
)
