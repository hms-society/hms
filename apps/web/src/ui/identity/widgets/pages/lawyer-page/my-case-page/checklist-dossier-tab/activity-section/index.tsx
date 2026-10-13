import type { ActivityItem } from '../../types'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type ActivitySectionProps = { activities: ActivityItem[] }

export const ActivitySection = ({ activities }: ActivitySectionProps) => (
  <section className='flex flex-col gap-4 rounded-lg border border-border bg-secondary p-5 shadow-xs'>
    <h2 className='font-serif text-lg font-semibold text-foreground'>
      Atividade Documental
    </h2>
    <div className='relative flex flex-col gap-4 before:absolute before:inset-y-1 before:left-3 before:w-px before:bg-border'>
      {activities.length > 0 ? (
        activities.map((activity) => (
          <div key={activity.id} className='relative z-10 flex items-start gap-3'>
            <div className='flex size-6 shrink-0 items-center justify-center rounded-full border border-border bg-background'>
              <Icon name={activity.icon} className='size-3 text-muted-foreground' />
            </div>
            <div className='flex flex-col gap-0.5'>
              <span className='text-[14px] font-semibold text-foreground'>
                {activity.title}
              </span>
              <span className='text-[14px] text-muted-foreground'>
                {activity.description}
              </span>
            </div>
          </div>
        ))
      ) : (
        <p className='text-sm text-muted-foreground'>
          Ainda não há atividades documentais registradas para este caso.
        </p>
      )}
    </div>
  </section>
)
