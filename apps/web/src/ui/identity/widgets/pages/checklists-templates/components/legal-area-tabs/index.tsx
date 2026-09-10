import type { LegalArea } from '../../types'

type LegalAreaTabsProps = {
  areas: LegalArea[]
  activeAreaId: string
  onChange: (areaId: string) => void
}

export function LegalAreaTabs({
  areas,
  activeAreaId,
  onChange,
}: LegalAreaTabsProps) {
  return (
    <nav
      className='flex items-center gap-1 overflow-x-auto border-b border-border'
      aria-label='Áreas do direito'
    >
      {areas.map((area) => {
        const active = area.id === activeAreaId

        return (
          <button
            key={area.id}
            type='button'
            onClick={() => onChange(area.id)}
            className={[
              'flex shrink-0 items-center gap-2 px-4 py-3 text-[14px] transition-colors',
              'border-b-2',
              active
                ? 'border-primary text-primary font-medium'
                : 'border-transparent text-foreground hover:text-primary',
            ].join(' ')}
          >
            {area.name}

            <span
              className={[
                'flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground',
              ].join(' ')}
            >
              {area.documentCount}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
