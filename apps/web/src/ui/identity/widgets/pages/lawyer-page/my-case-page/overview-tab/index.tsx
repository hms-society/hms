import type { CaseTask, CaseTeamMember, CaseTimelineItem, ChecklistItem } from '../types'
import { ChecklistNextAction } from './checklist-next-action'
import { ChecklistProgressCard } from './checklist-progress-card'
import { TasksPanel } from './tasks-panel'
import { TeamCard } from './team-card'
import { CaseFactsCard } from './case-facts-card'
import { TimelineCard } from './timeline-card'

export type OverviewTabProps = {
  checklist: ChecklistItem[]
  completionPercentage: number
  mandatoryItemsCount: number
  pendingItemsCount: number
  tasks: CaseTask[]
  team: CaseTeamMember[]
  timeline: CaseTimelineItem[]
  validatedItemsCount: number
  onOpenChecklist: () => void
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
        <TasksPanel tasks={props.tasks} />
      </div>
      <aside className='flex min-w-0 flex-col gap-4'>
        <TeamCard team={props.team} />
        <CaseFactsCard />
        <TimelineCard timeline={props.timeline} />
      </aside>
    </div>
  )
}
