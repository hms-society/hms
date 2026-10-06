import { useState } from 'react'

import { Icon } from '@/ui/shared/widgets/components/icon'
import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'

import { NewItemDialog } from './new-item-dialog'
import type { CreateTaskDeadlineInput, TaskDeadlineItem } from './types'
import type { CaseTeamMember } from '../types'

type Filter = 'Todos' | 'Prazos' | 'Tarefas'

const typeClasses: Record<string, string> = {
  'Prazo processual': 'bg-destructive/5 text-destructive/80',
  Audiência: 'bg-violet-100 text-violet-700',
  Publicação: 'bg-blue-100 text-blue-700',
  'Tarefa interna': 'bg-muted text-muted-foreground',
  Entrega: 'bg-primary/10 text-primary',
  Outro: 'bg-muted text-muted-foreground',
}

export function TasksDeadlinesTab({
  caseIdentifier,
  caseTitle,
  team = [],
}: {
  caseIdentifier: string
  caseTitle: string
  team?: readonly CaseTeamMember[]
}) {
  const [items, setItems] = useState<TaskDeadlineItem[]>([])
  const [filter, setFilter] = useState<Filter>('Todos')
  const [showCompleted, setShowCompleted] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<TaskDeadlineItem>()
  const openItems = items.filter(
    (item) =>
      !item.completed &&
      (filter === 'Todos' ||
        (filter === 'Prazos'
          ? item.type !== 'Tarefa interna'
          : item.type === 'Tarefa interna')),
  )
  const completedItems = items.filter((item) => item.completed)
  const createItem = (input: CreateTaskDeadlineInput) =>
    setItems((current) => [
      ...current,
      {
        ...input,
        id: crypto.randomUUID(),
        status: 'A fazer',
        completed: false,
      },
    ])
  const updateItem = (item: TaskDeadlineItem) =>
    setItems((current) =>
      current.map((currentItem) =>
        currentItem.id === item.id
          ? { ...item, completed: item.status === 'Concluída' }
          : currentItem,
      ),
    )
  return (
    <div className='flex flex-col gap-4'>
      <header className='flex flex-col gap-3 rounded-lg border border-border bg-secondary p-5 shadow-xs lg:flex-row lg:items-center lg:justify-between'>
        <div>
          <h2 className='font-serif text-xl font-semibold text-foreground'>
            Prazos e tarefas
          </h2>
          <p className='mt-1 text-sm text-muted-foreground'>
            Acompanhe os compromissos e atividades deste caso.
          </p>
        </div>
        <Button
          size='sm'
          className='rounded-full self-start lg:self-auto'
          onClick={() => {
            setEditingItem(undefined)
            setIsCreateOpen(true)
          }}
        >
          <Icon name='plus' className='size-3.5' />
          Novo item
        </Button>
      </header>
      <div className='grid gap-3 sm:grid-cols-3'>
        <SummaryStat
          value={String(items.filter((item) => item.status === 'Em andamento').length)}
          label='em andamento'
          icon='list-checks'
        />
        <SummaryStat
          value={String(openItems.length)}
          label='itens abertos'
          icon='list-checks'
        />
        <SummaryStat
          value={String(completedItems.length)}
          label='concluídos'
          icon='shield-alert'
        />
      </div>
      <section className='rounded-lg border border-border bg-secondary p-5 shadow-xs'>
        <div className='mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <h3 className='font-serif text-lg font-semibold text-foreground'>
              Itens abertos
            </h3>
            <p className='text-xs text-muted-foreground'>
              {openItems.length
                ? 'Ordenados pela urgência do caso.'
                : 'Nenhum item cadastrado neste caso.'}
            </p>
          </div>
          <div className='flex gap-2'>
            {(['Todos', 'Prazos', 'Tarefas'] as Filter[]).map((item) => (
              <Button
                key={item}
                variant={filter === item ? 'default' : 'outline'}
                size='xs'
                className='rounded-full'
                onClick={() => setFilter(item)}
              >
                {item}
              </Button>
            ))}
          </div>
        </div>
        <div className='flex flex-col divide-y divide-border'>
          {openItems.map((item) => (
            <TaskRow
              key={item.id}
              item={item}
              onEdit={(selectedItem) => {
                setEditingItem(selectedItem)
                setIsCreateOpen(true)
              }}
            />
          ))}
        </div>
        <div className='mt-4 border-t border-border pt-3'>
          <Button
            variant='ghost'
            size='sm'
            className='w-full justify-between text-muted-foreground'
            onClick={() => setShowCompleted((value) => !value)}
          >
            <span>Concluídos ({completedItems.length})</span>
            <Icon
              name={showCompleted ? 'chevron-up' : 'chevron-down'}
              className='size-4'
            />
          </Button>
          {showCompleted &&
            completedItems.map((item) => (
              <TaskRow
                key={item.id}
                item={item}
                onEdit={(selectedItem) => {
                  setEditingItem(selectedItem)
                  setIsCreateOpen(true)
                }}
              />
            ))}
        </div>
      </section>
      <NewItemDialog
        caseIdentifier={caseIdentifier}
        caseTitle={caseTitle}
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onCreate={createItem}
        team={team}
        editingItem={editingItem}
        onUpdate={updateItem}
      />
    </div>
  )
}

function SummaryStat({
  value,
  label,
  icon,
}: {
  value: string
  label: string
  icon: 'triangle-alert' | 'list-checks' | 'shield-alert'
}) {
  return (
    <div className='flex items-center gap-3 rounded-lg border border-border bg-secondary px-4 py-3 shadow-xs'>
      <span className='flex size-9 items-center justify-center rounded-lg bg-muted text-primary'>
        <Icon name={icon} className='size-4' />
      </span>
      <span>
        <strong className='text-lg text-foreground'>{value}</strong>
        <span className='ml-1 text-sm text-muted-foreground'>{label}</span>
      </span>
    </div>
  )
}

function TaskRow({
  item,
  onEdit,
}: {
  item: TaskDeadlineItem
  onEdit: (item: TaskDeadlineItem) => void
}) {
  const displayType = item.customType ?? item.type
  return (
    <article
      className={`flex flex-col gap-3 py-3 md:flex-row md:items-center md:gap-4 ${item.completed ? 'opacity-65' : ''}`}
    >
      <Badge
        className={`w-fit shrink-0 rounded-full border-0 text-[11px] ${typeClasses[item.type]}`}
      >
        <Icon
          name={item.type === 'Tarefa interna' ? 'list-checks' : 'calendar-clock'}
          className='size-3'
        />
        {displayType}
      </Badge>
      <div className='min-w-0 flex-1'>
        <p
          className={`text-sm font-medium ${item.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}
        >
          {item.description}
        </p>
        <p className='mt-1 text-xs text-muted-foreground'>{item.people.join(', ')}</p>
      </div>
      <div className='flex items-center justify-between gap-3 md:justify-end'>
        <div className='text-right text-xs'>
          <p className='font-semibold text-foreground'>{item.plannedDate}</p>
          <p className='text-muted-foreground'>{item.plannedTime || 'sem horário'}</p>
        </div>
        <Badge className='rounded-full border-0 bg-muted text-[11px] text-muted-foreground'>
          {item.status}
        </Badge>
        <Button
          aria-label={`Editar ${item.description}`}
          variant='ghost'
          size='icon-xs'
          onClick={() => onEdit(item)}
        >
          <Icon name='pencil' className='size-4 text-muted-foreground' />
        </Button>
      </div>
    </article>
  )
}
