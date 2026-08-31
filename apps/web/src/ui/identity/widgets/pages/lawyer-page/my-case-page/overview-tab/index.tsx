import { Icon } from '@/ui/shared/widgets/components/icon'
import { Avatar, AvatarFallback } from '@/ui/shadcn/avatar'
import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'

import {
  getChecklistIcon,
  getChecklistIconClasses,
  getChecklistRowClasses,
} from '../checklist-style'
import type { CaseTask, CaseTeamMember, CaseTimelineItem, ChecklistItem } from '../types'

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

export const OverviewTab = ({
  checklist,
  completionPercentage,
  mandatoryItemsCount,
  pendingItemsCount,
  tasks,
  team,
  timeline,
  validatedItemsCount,
  onOpenChecklist,
}: OverviewTabProps) => {
  const hasChecklistItems = mandatoryItemsCount > 0
  const isChecklistComplete = hasChecklistItems && pendingItemsCount === 0
  const checklistProgressLabel = `${validatedItemsCount} de ${mandatoryItemsCount} - ${completionPercentage}%`
  const checklistStatusLabel = isChecklistComplete
    ? 'Completo para validação'
    : pendingItemsCount > 0
      ? 'Recebimento parcial'
      : 'Checklist não instanciado'
  const nextActionTitle = isChecklistComplete
    ? 'Próxima ação: revisar o checklist final'
    : hasChecklistItems
      ? 'Próxima ação: completar a documentação do caso'
      : 'Próxima ação: instanciar o checklist documental'
  const nextActionDescription = !hasChecklistItems
    ? 'Nenhum item de checklist foi encontrado para este caso.'
    : isChecklistComplete
      ? 'Todos os documentos obrigatórios foram atendidos. Revise o gate do checklist para avançar.'
      : pendingItemsCount === 1
        ? '1 documento obrigatório ainda depende de recebimento ou validação.'
        : `${pendingItemsCount} documentos obrigatórios ainda dependem de recebimento ou validação.`
  const checklistBadgeVariant = !hasChecklistItems
    ? 'secondary'
    : isChecklistComplete
      ? 'success'
      : 'attention'

  return (
    <div className='grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]'>
      <div className='flex min-w-0 flex-col gap-4'>
        <div className='flex flex-col gap-3 rounded-lg border border-primary/30 bg-highlight p-4 shadow-xs md:flex-row md:items-center md:justify-between'>
          <div className='flex items-start gap-3'>
            <div className='flex size-10 shrink-0 items-center justify-center rounded-full bg-card text-primary'>
              <Icon name='list-checks' className='size-5' />
            </div>
            <div className='flex flex-col gap-0.5'>
              <h2 className='text-sm font-semibold text-primary'>{nextActionTitle}</h2>
              <p className='text-xs text-primary/80'>{nextActionDescription}</p>
            </div>
          </div>
          <Button size='xs' className='rounded-full' onClick={onOpenChecklist}>
            <Icon
              name={isChecklistComplete ? 'check-circle-2' : 'send'}
              className='size-3'
            />
            {isChecklistComplete ? 'Revisar checklist' : 'Abrir checklist'}
          </Button>
        </div>

        <section className='flex flex-col gap-4 rounded-lg border border-border bg-card p-5 shadow-xs'>
          <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
            <div className='flex flex-wrap items-center gap-2'>
              <h2 className='font-serif text-lg font-semibold text-foreground'>
                Checklist Documental
              </h2>
              <Badge
                variant={checklistBadgeVariant}
                className='h-5 rounded-full px-2 text-[10px]'
              >
                {checklistStatusLabel}
              </Badge>
            </div>
            <Button
              variant='link'
              size='xs'
              className='h-auto justify-start px-0 text-primary'
              onClick={onOpenChecklist}
            >
              Abrir checklist completo
              <Icon name='arrow-right' className='size-3' />
            </Button>
          </div>

          <div className='flex items-center gap-3'>
            <div className='h-2 flex-1 overflow-hidden rounded-full bg-muted'>
              <div
                className='h-full rounded-full bg-primary'
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <span className='text-[11px] font-semibold text-foreground'>
              {checklistProgressLabel}
            </span>
          </div>

          <div className='flex flex-col gap-2'>
            {checklist.length > 0 ? (
              checklist.map((item) => (
                <div
                  key={item.id}
                  className={`flex min-w-0 items-center justify-between gap-3 rounded-md border px-3 py-2 ${getChecklistRowClasses(
                    item.status,
                  )}`}
                >
                  <div className='flex min-w-0 items-center gap-3'>
                    <div
                      className={`flex size-6 shrink-0 items-center justify-center rounded-md ${getChecklistIconClasses(
                        item.status,
                      )}`}
                    >
                      <Icon name={getChecklistIcon(item.status)} className='size-3' />
                    </div>
                    <span className='truncate text-xs font-semibold text-foreground'>
                      {item.title}
                    </span>
                  </div>
                  {item.documentFileId ? (
                    <Badge
                      variant={
                        item.status === 'validado'
                          ? 'success'
                          : item.status === 'solicitado'
                            ? 'attention'
                            : 'secondary'
                      }
                      className='h-5 rounded-full px-2 text-[10px]'
                    >
                      {item.statusLabel ??
                        (item.status === 'validado'
                          ? 'Validado'
                          : item.status === 'solicitado'
                            ? 'Solicitado'
                            : 'Não solicitado')}
                    </Badge>
                  ) : null}
                </div>
              ))
            ) : (
              <div className='rounded-md border border-border bg-muted/30 px-3 py-4 text-xs text-muted-foreground'>
                Nenhum item de checklist documental foi encontrado para este caso.
              </div>
            )}
          </div>
        </section>

        <section className='flex flex-col gap-3 rounded-lg border border-border bg-card p-5 shadow-xs'>
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
              <div
                key={task.title}
                className='flex flex-col gap-3 rounded-md border border-border bg-card px-3 py-3 md:flex-row md:items-center md:justify-between'
              >
                <div className='flex min-w-0 items-start gap-3'>
                  <div className='flex size-8 shrink-0 items-center justify-center rounded-md bg-highlight text-primary'>
                    <Icon name={task.icon} className='size-4' />
                  </div>
                  <div className='flex min-w-0 flex-col gap-0.5'>
                    <span className='text-xs font-semibold text-foreground'>
                      {task.title}
                    </span>
                    <span className='text-[10px] text-muted-foreground'>
                      {task.description} · {task.assignee}
                    </span>
                  </div>
                </div>
                <Badge
                  variant={task.status === 'Em aberto' ? 'secondary' : 'attention'}
                  className='h-5 self-start rounded-full px-2 text-[10px] md:self-center'
                >
                  {task.status}
                </Badge>
              </div>
            ))}
          </div>
          <div className='flex items-center gap-2 rounded-md bg-muted/60 px-3 py-2 text-[11px] text-muted-foreground'>
            <Icon name='shield-check' className='size-3 text-primary' />
            Nenhum prazo processual crítico. Prazos passam a ser monitorados após o
            protocolo.
          </div>
        </section>
      </div>

      <aside className='flex min-w-0 flex-col gap-4'>
        <section className='flex flex-col gap-3 rounded-lg border border-border bg-card p-4 shadow-xs'>
          <div className='flex items-center justify-between'>
            <h2 className='font-serif text-base font-semibold text-foreground'>
              Equipe do Caso
            </h2>
            <Button variant='link' size='xs' className='h-auto px-0 text-primary'>
              Editar
            </Button>
          </div>
          <div className='flex flex-col gap-2'>
            {team.map((member, index) => (
              <div
                key={member.initials}
                className={`flex items-center gap-3 rounded-md p-2 ${
                  index === 0 ? 'bg-highlight' : ''
                }`}
              >
                <Avatar className='size-8'>
                  <AvatarFallback className={`${member.className} text-[10px]`}>
                    {member.initials}
                  </AvatarFallback>
                </Avatar>
                <div className='min-w-0 flex-1'>
                  <p className='truncate text-xs font-semibold text-foreground'>
                    {member.name}
                  </p>
                  <p className='truncate text-[10px] text-muted-foreground'>
                    {member.role}
                  </p>
                </div>
                {index === 0 && (
                  <Icon name='shield-check' className='size-3.5 text-primary' />
                )}
              </div>
            ))}
          </div>
        </section>

        <section className='flex flex-col gap-3 rounded-lg border border-border bg-card p-4 shadow-xs'>
          <h2 className='font-serif text-base font-semibold text-foreground'>
            Dados do Caso
          </h2>
          <dl className='grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 text-[11px]'>
            <dt className='text-muted-foreground'>Contratação</dt>
            <dd className='font-semibold text-foreground'>CONT-20260701-0113</dd>
            <dt className='text-muted-foreground'>Tipo de serviço</dt>
            <dd className='font-semibold text-foreground'>
              Processo administrativo INSS
            </dd>
            <dt className='text-muted-foreground'>Abertura</dt>
            <dd className='font-semibold text-foreground'>03/07/2026</dd>
            <dt className='text-muted-foreground'>Origem</dt>
            <dd className='font-semibold text-foreground'>Intake #INT-2026-0457</dd>
            <dt className='text-muted-foreground'>Cliente desde</dt>
            <dd className='font-semibold text-foreground'>01/07/2026</dd>
          </dl>
        </section>

        <section className='flex flex-col gap-3 rounded-lg border border-border bg-card p-4 shadow-xs'>
          <h2 className='font-serif text-base font-semibold text-foreground'>
            Linha do Tempo
          </h2>
          <div className='relative flex flex-col gap-3 before:absolute before:inset-y-2 before:left-3 before:w-px before:bg-border'>
            {timeline.map((item) => (
              <div key={item.title} className='relative z-10 flex items-start gap-3'>
                <div className='flex size-6 shrink-0 items-center justify-center rounded-full border border-border bg-background'>
                  <Icon name={item.icon} className='size-3 text-primary' />
                </div>
                <div className='flex flex-col gap-0.5'>
                  <span className='text-xs font-semibold text-foreground'>
                    {item.title}
                  </span>
                  <span className='text-[10px] text-muted-foreground'>
                    {item.description}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <Button variant='link' size='xs' className='h-auto justify-start px-0'>
            Ver auditoria completa
          </Button>
        </section>
      </aside>
    </div>
  )
}
