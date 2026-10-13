import { Icon } from '@/ui/shared/widgets/components/icon'
import { Avatar, AvatarFallback } from '@/ui/shadcn/avatar'
import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'

import {
  getChecklistIcon,
  getChecklistIconClasses,
  getChecklistRowClasses,
} from '../checklist-style'
import type { CaseTeamMember, CaseTimelineItem, ChecklistItem } from '../types'

import { useOverviewTab } from './use-overview-tab'

export type OverviewTabProps = {
  caseId: string
  checklist: ChecklistItem[]
  completionPercentage: number
  mandatoryItemsCount: number
  pendingItemsCount: number
  currentCollaboratorId?: string
  team: CaseTeamMember[]
  timeline: CaseTimelineItem[]
  validatedItemsCount: number
  onOpenChecklist: () => void
  onOpenTasks?: () => void
}

export const OverviewTab = ({
  caseId,
  checklist,
  completionPercentage,
  mandatoryItemsCount,
  pendingItemsCount,
  currentCollaboratorId,
  team,
  timeline,
  validatedItemsCount,
  onOpenChecklist,
  onOpenTasks,
}: OverviewTabProps) => {
  const {
    documentPendings,
    documentPendingsError,
    isLoadingDocumentPendings,
    caseTasksError,
    isLoadingCaseTasks,
    priorityItems,
    handleOpenChecklistItem,
  } = useOverviewTab({
    caseId,
    currentCollaboratorId,
  })
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
            <div className='flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-primary'>
              <Icon name='list-checks' className='size-5' />
            </div>
            <div className='flex flex-col gap-0.5'>
              <h2 className='text-[16px] font-semibold text-primary'>
                {nextActionTitle}
              </h2>
              <p className='text-[14px] text-primary/80'>{nextActionDescription}</p>
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

        <section className='flex flex-col gap-4 rounded-lg border border-border bg-secondary p-5 shadow-xs'>
          <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
            <div className='flex flex-wrap items-center gap-2'>
              <h2 className='font-serif text-lg font-semibold text-foreground'>
                Checklist Documental
              </h2>
              <Badge
                variant={checklistBadgeVariant}
                className='h-6 rounded-full px-3 text-[12px]'
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
            <span className='text-[14px] font-semibold text-foreground'>
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
                    <span className='truncate text-[14px] font-semibold text-foreground'>
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
                      className='h-6 rounded-full px-3 text-[12px]'
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

        <section className='flex flex-col gap-3 rounded-lg border border-border bg-secondary p-5 shadow-xs'>
          <div className='flex items-center justify-between gap-4'>
            <h2 className='font-serif text-lg font-semibold text-foreground'>
              Pendências e Tarefas
            </h2>
            <Button
              variant='link'
              size='xs'
              className='h-auto px-0 text-primary'
              disabled={!onOpenTasks}
              onClick={onOpenTasks}
            >
              Ver todas
            </Button>
          </div>
          <div className='flex flex-col gap-2'>
            {isLoadingCaseTasks ? (
              <p className='rounded-md border border-border bg-background px-3 py-4 text-sm text-muted-foreground'>
                Carregando tarefas e prazos…
              </p>
            ) : caseTasksError ? (
              <p
                role='alert'
                className='rounded-md border border-border bg-background px-3 py-4 text-sm text-destructive'
              >
                Não foi possível carregar tarefas e prazos.
              </p>
            ) : priorityItems.length > 0 ? (
              priorityItems.map((task) => (
                <div
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
                      <span className='text-[14px] font-semibold text-foreground'>
                        {task.title}
                      </span>
                      <span className='text-[14px] text-muted-foreground'>
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
                      className='h-6 rounded-full px-3 text-[12px]'
                    >
                      {task.isOverdue
                        ? 'Atrasado'
                        : task.blocksCaseClosure
                          ? 'Impeditiva'
                          : task.statusLabel}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className='rounded-md border border-border bg-background px-3 py-4 text-sm text-muted-foreground'>
                Nenhuma tarefa ou prazo requer atenção neste momento.
              </p>
            )}
          </div>
          <div className='flex flex-col gap-2 border-t border-border pt-3'>
            <h3 className='text-sm font-semibold text-foreground'>
              Pendências documentais
            </h3>
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
                        <p className='mt-1 flex items-center gap-1 text-xs text-muted-foreground'>
                          <Icon
                            name='message-square-text'
                            className='size-3.5 shrink-0'
                          />
                          {pending.messageStatusLabel}
                        </p>
                      ) : null}
                      {pending.messagePreview ? (
                        <p className='mt-1 break-words text-xs text-muted-foreground'>
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
                {caseId
                  ? 'Nenhuma pendência documental ativa.'
                  : 'Vínculo do caso indisponível para consultar pendências documentais.'}
              </p>
            )}
          </div>
          <div className='flex items-center gap-2 rounded-md bg-muted/60 px-3 py-2 text-[14px] text-muted-foreground'>
            <Icon name='shield-check' className='size-3.5 text-primary' />
            Priorização baseada nos prazos e tarefas ativos deste caso.
          </div>
        </section>
      </div>

      <aside className='flex min-w-0 flex-col gap-4'>
        <section className='flex flex-col gap-3 rounded-lg border border-border bg-secondary p-4 shadow-xs'>
          <div className='flex items-center justify-between'>
            <h2 className='font-serif text-[16px] font-semibold text-foreground'>
              Equipe do Caso
            </h2>
            <Button variant='link' size='xs' className='h-auto px-0 text-primary'>
              Editar
            </Button>
          </div>
          <div className='flex flex-col gap-2'>
            {team.map((member: any) => (
              <div
                key={member.collaboratorId}
                className={`flex items-center gap-3 rounded-md p-2 ${
                  member.isPrimary ? 'bg-highlight' : ''
                }`}
              >
                <Avatar className='size-9'>
                  <AvatarFallback className='bg-teal-700 text-white text-[12px]'>
                    {member.name?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className='min-w-0 flex-1'>
                  <p className='truncate text-[14px] font-semibold text-foreground'>
                    {member.name}
                  </p>
                  <p className='truncate text-[14px] text-muted-foreground'>
                    {member.role === 'lead_lawyer'
                      ? 'Advogado Principal'
                      : member.role === 'lawyer'
                        ? 'Advogado'
                        : member.role === 'paralegal'
                          ? 'Paralegal'
                          : member.role === 'supervisor'
                            ? 'Supervisor'
                            : member.role === 'intern'
                              ? 'Estagiário'
                              : member.role}{' '}
                    {member.permission
                      ? `- ${member.permission.charAt(0).toUpperCase() + member.permission.slice(1)}`
                      : ''}
                  </p>
                </div>
                {member.isPrimary && (
                  <Icon name='shield-check' className='size-3.5 text-primary' />
                )}
              </div>
            ))}
          </div>
        </section>

        <section className='flex flex-col gap-3 rounded-lg border border-border bg-secondary p-4 shadow-xs'>
          <h2 className='font-serif text-[16px] font-semibold text-foreground'>
            Dados do Caso
          </h2>
          <dl className='grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 text-[14px]'>
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
                  <span className='text-[14px] text-muted-foreground'>
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
