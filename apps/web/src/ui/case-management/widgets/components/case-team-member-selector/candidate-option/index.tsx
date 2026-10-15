import type { CaseEligibleCollaborator } from '@hms/core/case-management/domain/structures'

import { Icon } from '@/ui/shared/widgets/components/icon'
import { Avatar, AvatarFallback } from '@/ui/shadcn/avatar'

export type CandidateOptionProps = {
  candidate: CaseEligibleCollaborator
  isSelected: boolean
  getProfileLabel: (profile: CaseEligibleCollaborator['profile']) => string
  onSelect: (candidate: CaseEligibleCollaborator) => void
}

export const CandidateOption = ({
  candidate,
  isSelected,
  getProfileLabel,
  onSelect,
}: CandidateOptionProps) => (
  <button
    type='button'
    className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isSelected ? 'border-ring bg-highlight text-highlight-foreground' : 'border-border bg-card text-card-foreground hover:bg-muted/40'}`}
    aria-pressed={isSelected}
    onClick={() => onSelect(candidate)}
  >
    <Avatar className='size-10 rounded-full'>
      <AvatarFallback className='rounded-full bg-secondary text-secondary-foreground'>
        {candidate.professionalName.slice(0, 2).toUpperCase()}
      </AvatarFallback>
    </Avatar>
    <span className='min-w-0 flex-1'>
      <span className='block truncate text-sm font-medium'>
        {candidate.professionalName}
      </span>
      <span className='block text-xs text-muted-foreground'>
        {getProfileLabel(candidate.profile)}
      </span>
      <span className='block truncate text-xs text-muted-foreground'>
        {candidate.email}
      </span>
    </span>
    {isSelected && (
      <span className='flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground'>
        <Icon name='check' className='size-4' />
      </span>
    )}
  </button>
)
