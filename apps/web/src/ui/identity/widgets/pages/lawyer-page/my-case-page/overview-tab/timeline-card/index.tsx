import type { CaseTimelineItem } from '../../types'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { Button } from '@/ui/shadcn/button'

export type TimelineCardProps = { timeline: CaseTimelineItem[] }

export const TimelineCard = ({ timeline }: TimelineCardProps) => (
  <section className='flex flex-col gap-3 rounded-lg border border-border bg-secondary p-4 shadow-xs'>
    <h2 className='font-serif text-[16px] font-semibold text-foreground'>
      Linha do Tempo
    </h2>
    <div className='relative flex flex-col gap-3 before:absolute before:inset-y-2 before:left-3 before:w-px before:bg-border'>
      {timeline.map((item) => (
        <div key={item.title} className='relative z-10 flex items-start gap-3'>
          <div className='flex size-6 shrink-0 items-center justify-center rounded-full border border-border bg-background'>
            <Icon name={item.icon} className='size-3 text-primary' />
          </div>
          <div className='flex flex-col gap-0.5'>
            <span className='text-[14px] font-semibold text-foreground'>
              {item.title}
            </span>
            <span className='text-[14px] text-muted-foreground'>{item.description}</span>
          </div>
        </div>
      ))}
    </div>
    <Button variant='link' size='xs' className='h-auto justify-start px-0'>
      Ver auditoria completa
    </Button>
  </section>
)
