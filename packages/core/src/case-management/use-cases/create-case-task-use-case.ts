import type { UseCase } from '#shared/interfaces/use-case'
import { BadRequestError } from '#shared/domain/errors'
import type { CaseMembersRepository, CaseTasksRepository } from '../interfaces'
import type { CaseTask, CaseTaskReminderCreation } from '../domain/entities'
import { CaseTaskSource, CaseTaskStatus, CaseTaskType } from '../domain/structures'
import type { DatetimeProvider } from '#shared/interfaces'

type Request = {
  caseId: string
  type: CaseTask['type']
  customType?: string
  description: string
  plannedDate: string
  plannedTime?: string
  createdById: string
  assigneeIds?: readonly string[]
  reminders?: readonly CaseTaskReminderCreation[]
  source?: CaseTask['source']
  completionNote?: string
}

export class CreateCaseTaskUseCase implements UseCase<Request, CaseTask> {
  constructor(
    private readonly caseTasksRepository: CaseTasksRepository,
    private readonly caseMembersRepository: CaseMembersRepository,
    private readonly datetimeProvider: DatetimeProvider,
  ) {}

  async execute(request: Request): Promise<CaseTask> {
    const description = request.description.trim()
    const customType = request.customType?.trim() || undefined
    const assigneeIds = [...new Set(request.assigneeIds ?? [])]
    const now = this.datetimeProvider.now()

    this.validateRequest(request, description, customType, now)
    await this.ensureActiveAssignees(request.caseId, assigneeIds)

    return this.caseTasksRepository.add({
      caseId: request.caseId,
      type: request.type,
      customType,
      description,
      plannedDate: request.plannedDate,
      plannedTime: request.plannedTime,
      status: CaseTaskStatus.ToDo,
      createdById: request.createdById,
      source: request.source ?? CaseTaskSource.Manual,
      completionNote: request.completionNote?.trim() || undefined,
      assigneeIds,
      reminders: request.reminders ?? [],
    })
  }

  private async ensureActiveAssignees(caseId: string, assigneeIds: readonly string[]) {
    const activeAssigneeIds =
      await this.caseMembersRepository.findActiveCollaboratorIdsByCaseId(
        caseId,
        assigneeIds,
      )

    if (activeAssigneeIds.length !== assigneeIds.length) {
      throw new BadRequestError(
        'Todos os responsáveis devem pertencer à equipe ativa do caso.',
      )
    }
  }

  private validateRequest(
    request: Request,
    description: string,
    customType: string | undefined,
    now: Date,
  ) {
    if (!description) {
      throw new BadRequestError('A descrição é obrigatória.')
    }

    if (request.type === CaseTaskType.Other && !customType) {
      throw new BadRequestError('Informe o tipo personalizado do item.')
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(request.plannedDate)) {
      throw new BadRequestError('A data prevista deve estar no formato AAAA-MM-DD.')
    }

    const plannedDate = new Date(`${request.plannedDate}T00:00:00.000Z`)
    const currentDate = new Date(now.toISOString().slice(0, 10) + 'T00:00:00.000Z')
    if (Number.isNaN(plannedDate.getTime()) || plannedDate < currentDate) {
      throw new BadRequestError('A data prevista não pode ser anterior à data atual.')
    }
  }
}
