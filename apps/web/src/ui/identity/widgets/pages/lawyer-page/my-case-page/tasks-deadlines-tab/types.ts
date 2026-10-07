export type TaskDeadlineType =
  | 'Prazo processual'
  | 'Audiência'
  | 'Publicação'
  | 'Tarefa interna'
  | 'Entrega'
  | 'Outro'

export type TaskDeadlineItem = {
  id: string
  type: TaskDeadlineType
  description: string
  plannedDate: string
  plannedTime?: string
  people: string[]
  assigneeIds?: string[]
  alerts?: string[]
  customType?: string
  status: string
  completed?: boolean
}

export type CreateTaskDeadlineInput = Omit<
  TaskDeadlineItem,
  'id' | 'status' | 'completed'
>
