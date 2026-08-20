import { Icon } from '@/ui/shared/widgets/components/icon'
import { cn } from '@/ui/shadcn/utils'
import { useCollapsibleCard, type CollapsibleCardProps } from './use-collapsible-card'

export type { CollapsibleCardProps } from './use-collapsible-card'

export const CollapsibleCard = ({
  title,
  children,
  headerActions,
  isOptional = false,
  className,
  contentClassName,
  defaultOpen = true,
}: CollapsibleCardProps) => {
  const { contentId, handleToggle, isOpen } = useCollapsibleCard(defaultOpen)

  return (
    <section
      className={cn(
        'bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-5 sm:px-8 sm:py-6 space-y-4',
        className,
      )}
    >
      <div className='flex items-center justify-between gap-4'>
        <div className='flex min-w-0 flex-1 items-center gap-2'>
          <div className='min-w-0 flex-1'>{title}</div>
          {isOptional && (
            <span className='shrink-0 rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold text-muted-foreground'>
              Opcional
            </span>
          )}
        </div>

        <div className='flex items-center gap-2 shrink-0'>
          {headerActions}
          <button
            type='button'
            onClick={handleToggle}
            aria-controls={contentId}
            aria-expanded={isOpen}
            aria-label={isOpen ? 'Recolher card' : 'Expandir card'}
            className='rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 cursor-pointer'
          >
            <Icon name={isOpen ? 'chevron-up' : 'chevron-down'} className='w-4 h-4' />
          </button>
        </div>
      </div>

      <div
        id={contentId}
        aria-hidden={!isOpen}
        className={cn(
          'grid transition-[grid-template-rows] duration-200 ease-out',
          isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className={cn('min-h-0 overflow-hidden space-y-4', contentClassName)}>
          {children}
        </div>
      </div>
    </section>
  )
}
