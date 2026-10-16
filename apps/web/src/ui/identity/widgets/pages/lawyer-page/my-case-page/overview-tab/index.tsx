import type { CaseTask, CaseTeamMember, CaseTimelineItem, ChecklistItem } from '../types'
import { ChecklistNextAction } from './checklist-next-action'
import { ChecklistProgressCard } from './checklist-progress-card'
import { TeamCard } from './team-card'
import { CaseFactsCard } from './case-facts-card'
import { TimelineCard } from './timeline-card'
import { useOverviewTab } from './use-overview-tab'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'

export type OverviewTabProps = {
  caseId?: string
  checklist: ChecklistItem[]
  completionPercentage: number
  mandatoryItemsCount: number
  pendingItemsCount: number
  tasks?: CaseTask[]
  currentCollaboratorId?: string
  team: CaseTeamMember[]
  timeline: CaseTimelineItem[]
  validatedItemsCount: number
  onOpenChecklist: () => void
  onOpenTasks?: () => void
}

function getNextAction(props: OverviewTabProps) {
  const hasItems = props.mandatoryItemsCount > 0
  const isComplete = hasItems && props.pendingItemsCount === 0
  const title = isComplete
    ? 'Próxima ação: revisar o checklist final'
    : hasItems
      ? 'Próxima ação: completar a documentação do caso'
      : 'Próxima ação: instanciar o checklist documental'
  const description = !hasItems
    ? 'Nenhum item de checklist foi encontrado para este caso.'
    : isComplete
      ? 'Todos os documentos obrigatórios foram atendidos. Revise o gate do checklist para avançar.'
      : props.pendingItemsCount === 1
        ? '1 documento obrigatório ainda depende de recebimento ou validação.'
        : `${props.pendingItemsCount} documentos obrigatórios ainda dependem de recebimento ou validação.`
  return { title, description, isComplete }
}

export const OverviewTab = (props: OverviewTabProps) => {
  const nextAction = getNextAction(props)
  const {
    documentPendings,
    documentPendingsError,
    isLoadingDocumentPendings,
    caseTasksError,
    isLoadingCaseTasks,
    priorityItems,
    handleOpenChecklistItem,
  } = useOverviewTab({
    caseId: props.caseId,
    currentCollaboratorId: props.currentCollaboratorId,
  })

  return (
    <div className='grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]'>
      <div className='flex min-w-0 flex-col gap-4'>
        <ChecklistNextAction {...nextAction} onOpenChecklist={props.onOpenChecklist} />
        <ChecklistProgressCard
          items={props.checklist}
          completionPercentage={props.completionPercentage}
          mandatoryItemsCount={props.mandatoryItemsCount}
          pendingItemsCount={props.pendingItemsCount}
          validatedItemsCount={props.validatedItemsCount}
          onOpenChecklist={props.onOpenChecklist}
        />
        <section className='flex flex-col gap-3 rounded-lg border border-border bg-secondary p-5 shadow-xs'>
          <div className='flex items-center justify-between gap-4'>
            <h2 className='font-serif text-lg font-semibold text-foreground'>
              Prazos e tarefas prioritários
            </h2>
            {props.onOpenTasks ? (
              <Button
                variant='link'
                size='xs'
                className='h-auto px-0 text-primary'
                onClick={props.onOpenTasks}
              >
                Ver todos
              </Button>
            ) : null}
          </div>
          {isLoadingCaseTasks ? (
            <p className='text-sm text-muted-foreground'>Carregando tarefas e prazos…</p>
          ) : caseTasksError ? (
            <p role='alert' className='text-sm text-destructive'>
              Não foi possível carregar as tarefas e os prazos.
            </p>
          ) : priorityItems.length > 0 ? (
            <div className='flex flex-col gap-2'>
              {priorityItems.map((task) => (
                <article
                  key={task.id}
                  className='flex flex-col gap-3 rounded-md border border-border bg-background px-3 py-3 md:flex-row md:items-center md:justify-between'
                >
                  <div className='flex min-w-0 items-start gap-3'>
                    <div className='flex size-8 shrink-0 items-center justify-center rounded-md bg-highlight text-primary'>
                      <Icon
                        name={
                          task.type === 'internal_task' ? 'list-checks' : 'calendar-clock'
                        }
                        className='size-4'
                      />
                    </div>
                    <div className='flex min-w-0 flex-col gap-0.5'>
                      <span className='text-sm font-semibold text-foreground'>
                        {task.title}
                      </span>
                      <span className='text-sm text-muted-foreground'>
                        {task.description || task.typeLabel}
                        {task.assigneeIds.length > 0
                          ? ` · ${task.isAssignedToCurrentUser ? 'Atribuída a você' : 'Atribuída à equipe'}`
                          : ''}
                      </span>
                    </div>
                  </div>
                  <div className='flex shrink-0 items-center gap-2 self-start md:self-center'>
                    <span className='text-xs text-muted-foreground'>
                      {task.plannedDateLabel}
                    </span>
                    <Badge
                      variant={
                        task.isOverdue
                          ? 'destructive'
                          : task.blocksCaseClosure
                            ? 'attention'
                            : 'secondary'
                      }
                      className='h-6 rounded-full px-3 text-xs'
                    >
                      {task.isOverdue
                        ? 'Atrasado'
                        : task.blocksCaseClosure
                          ? 'Impeditiva'
                          : task.statusLabel}
                    </Badge>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className='rounded-md border border-border bg-background px-3 py-4 text-sm text-muted-foreground'>
              Nenhuma tarefa ou prazo requer atenção neste momento.
            </p>
          )}
        </section>
        <section className='flex flex-col gap-3 rounded-lg border border-border bg-secondary p-5 shadow-xs'>
          <h2 className='font-serif text-lg font-semibold text-foreground'>
            Pendências documentais
          </h2>
          {isLoadingDocumentPendings ? (
            <p className='text-sm text-muted-foreground'>
              Carregando pendências documentais…
            </p>
          ) : documentPendingsError ? (
            <p role='alert' className='text-sm text-destructive'>
              Não foi possível carregar as pendências documentais.
            </p>
          ) : documentPendings.length > 0 ? (
            documentPendings.map((pending) => (
              <article
                key={pending.id}
                className='flex flex-col gap-2 rounded-md border border-border bg-background p-3 sm:flex-row sm:items-start sm:justify-between'
              >
                <div className='flex min-w-0 items-start gap-2'>
                  <Icon
                    name='triangle-alert'
                    className='mt-0.5 size-4 shrink-0 text-primary'
                  />
                  <div className='min-w-0'>
                    <p className='text-sm font-semibold text-foreground'>
                      {pending.title}
                    </p>
                    <p className='break-words text-sm text-muted-foreground'>
                      {pending.reasonLabel}
                      {pending.documentFileName ? ` · ${pending.documentFileName}` : ''}
                    </p>
                    {pending.messageStatusLabel ? (
                      <p className='mt-1 text-xs text-muted-foreground'>
                        {pending.messageStatusLabel}
                      </p>
                    ) : null}
                    {pending.messagePreview ? (
                      <p className='mt-1 text-xs text-muted-foreground'>
                        {pending.messagePreview}
                      </p>
                    ) : null}
                  </div>
                </div>
                <Button
                  variant='link'
                  size='xs'
                  className='h-auto shrink-0 justify-start px-0 text-primary'
                  onClick={() => handleOpenChecklistItem(pending.checklistItemId)}
                >
                  Ver documento
                  <Icon name='arrow-right' className='size-3' />
                </Button>
              </article>
            ))
          ) : (
            <p className='text-sm text-muted-foreground'>
              Nenhuma pendência documental ativa.
            </p>
          )}
        </section>
      </div>
      <aside className='flex min-w-0 flex-col gap-4'>
        <TeamCard team={props.team} />
        <CaseFactsCard />
        <TimelineCard timeline={props.timeline} />
      </aside>
    </div>
  )
}
