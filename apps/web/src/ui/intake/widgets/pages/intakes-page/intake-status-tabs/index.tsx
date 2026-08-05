import type { IntakeListStatus } from '@hms/core/intake/domain/structures'

import { cn } from '@/ui/shadcn/utils'

import { INTAKE_STATUS_TABS } from '../intakes-page-constants'

export type IntakeStatusTabsProps = {
  activeStatus?: IntakeListStatus | null
  counts?: { all: number; byStatus: Readonly<Record<string, number>> }
  onStatusChange: (status: IntakeListStatus | null) => void
}

export const IntakeStatusTabs = ({
  activeStatus,
  counts,
  onStatusChange,
}: IntakeStatusTabsProps) => {
  return (
    <div
      className='overflow-x-auto border-b border-border'
      role='tablist'
      aria-label='Filtrar intakes por status'
    >
      <div className='flex min-w-max gap-1'>
        {INTAKE_STATUS_TABS.map((tab) => {
          const isActive = (tab.value ?? null) === (activeStatus ?? null)
          const count =
            tab.countKey === 'all' ? counts?.all : counts?.byStatus[tab.countKey]

          return (
            <button
              key={tab.label}
              type='button'
              role='tab'
              aria-selected={isActive}
              className={cn(
                'relative flex min-h-11 items-center gap-2 px-3 text-sm font-medium text-muted-foreground outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 hover:text-foreground',
                isActive &&
                  'text-brand after:absolute after:right-3 after:bottom-0 after:left-3 after:h-0.5 after:bg-brand',
              )}
              onClick={() => onStatusChange(tab.value ?? null)}
            >
              {tab.label}
              <span
                className={cn(
                  'rounded-full bg-muted px-1.5 py-0.5 text-xs tabular-nums',
                  isActive && 'bg-highlight text-highlight-foreground',
                )}
              >
                {count ?? 0}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
