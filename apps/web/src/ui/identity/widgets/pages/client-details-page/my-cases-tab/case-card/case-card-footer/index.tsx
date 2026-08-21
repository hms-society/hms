import type { MouseEventHandler } from 'react'

import type { IntakeStatus } from '@hms/core/intake/domain/structures'

import { Icon } from '@/ui/shared/widgets/components/icon'

import { CaseStatusBadge } from '../../case-status-badge'

export type CaseCardFooterProps = {
  status?: IntakeStatus
  onNavigate: MouseEventHandler<HTMLButtonElement>
}

export const CaseCardFooter = ({ status, onNavigate }: CaseCardFooterProps) => {
  return (
    <div className='flex justify-between items-center pt-4 border-t border-border w-full mt-auto'>
      <CaseStatusBadge status={status} />
      <button
        type='button'
        aria-label='Abrir caso'
        onClick={onNavigate}
        className='p-1 rounded-full group-hover:bg-primary/10 transition-colors duration-300 cursor-pointer'
      >
        <Icon
          name='chevron-down'
          className='size-4 text-muted-foreground group-hover:text-primary transition-all duration-300'
        />
      </button>
    </div>
  )
}
