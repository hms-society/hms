import type { UseFieldArrayUpdate } from 'react-hook-form'
import type {
  CaseMemberRole,
  CaseEligibleCollaborator,
} from '@hms/core/case-management/domain/structures'
import type { CreateCaseData } from '@hms/validation/case-management'
import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { TeamRosterMember } from '../team-roster-member'

type TeamField = { id: string; collaboratorId: string; role: CaseMemberRole }

export type TeamRosterProps = {
  fields: readonly TeamField[]
  members: readonly CaseEligibleCollaborator[]
  onAdd: () => void
  onRemove: (index: number) => void
  onUpdate: UseFieldArrayUpdate<CreateCaseData, 'team'>
}

export const TeamRoster = ({
  fields,
  members,
  onAdd,
  onRemove,
  onUpdate,
}: TeamRosterProps) => (
  <div className='space-y-3'>
    <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
      <h3 className='text-sm font-medium'>Outros membros</h3>
      <Button
        type='button'
        variant='outline'
        className='w-full rounded-full sm:w-auto'
        onClick={onAdd}
      >
        <Icon name='plus' className='mr-1.5 size-4' />
        Adicionar membro
      </Button>
    </div>
    {fields.length === 0 ? (
      <p className='rounded-xl border border-dashed border-border py-5 text-center text-sm text-muted-foreground'>
        Nenhum outro membro selecionado.
      </p>
    ) : (
      fields.map((field, index) => (
        <TeamRosterMember
          key={field.id}
          role={field.role}
          member={members[index]}
          onRoleChange={(role) => onUpdate(index, { ...field, role })}
          onRemove={() => onRemove(index)}
        />
      ))
    )}
  </div>
)
