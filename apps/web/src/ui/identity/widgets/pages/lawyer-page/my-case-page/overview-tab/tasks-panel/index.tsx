import type { CaseTask } from '../../types'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'

export type TasksPanelProps = { tasks: CaseTask[] }

export const TasksPanel = ({ tasks }: TasksPanelProps) => (
  <section className='flex flex-col gap-3 rounded-lg border border-border bg-secondary p-5 shadow-xs'>
    <div className='flex items-center justify-between gap-4'>
      <h2 className='font-serif text-lg font-semibold text-foreground'>
        Pendências e Tarefas
      </h2>
      <Button variant='link' size='xs' className='h-auto px-0 text-primary'>
        Ver todas
      </Button>
    </div>
    <div className='flex flex-col gap-2'>
      {tasks.map((task) => (
        <article
          key={task.title}
          className='flex flex-col gap-3 rounded-md border border-border bg-background px-3 py-3 md:flex-row md:items-center md:justify-between'
        >
          <div className='flex min-w-0 items-start gap-3'>
            <div className='flex size-8 shrink-0 items-center justify-center rounded-md bg-highlight text-primary'>
              <Icon name={task.icon} className='size-4' />
            </div>
            <div className='flex min-w-0 flex-col gap-0.5'>
              <span className='text-[14px] font-semibold text-foreground'>
                {task.title}
              </span>
              <span className='text-[14px] text-muted-foreground'>
                {task.description} · {task.assignee}
              </span>
            </div>
          </div>
          <Badge
            variant={task.status === 'Em aberto' ? 'secondary' : 'attention'}
            className='h-6 self-start rounded-full px-3 text-[12px] md:self-center'
          >
            {task.status}
          </Badge>
        </article>
      ))}
    </div>
    <div className='flex items-center gap-2 rounded-md bg-muted/60 px-3 py-2 text-[14px] text-muted-foreground'>
      <Icon name='shield-check' className='size-3.5 text-primary' />
      Nenhum prazo processual crítico. Prazos passam a ser monitorados após o protocolo.
    </div>
  </section>
)
