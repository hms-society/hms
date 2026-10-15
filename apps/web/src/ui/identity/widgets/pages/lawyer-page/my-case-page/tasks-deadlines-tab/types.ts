export type TaskDeadlineType =
  | 'Prazo processual'
  | 'Audiência'
  | 'Publicação'
  | 'Tarefa interna'
  | 'Entrega'
  | 'Outro'

export type TaskDeadlineItem = {
  id: string
  version?: number
  type: TaskDeadlineType
  title: string
  description: string
  plannedDate: string
  plannedTime?: string
  people: readonly string[]
  assigneeIds?: readonly string[]
  alerts?: readonly string[]
  customType?: string
  status: string
  completed?: boolean
}

export type CreateTaskDeadlineInput = Omit<
  TaskDeadlineItem,
  'id' | 'status' | 'completed'
>
