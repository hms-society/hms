import type { UseCase } from '#shared/interfaces/use-case'
import { BadRequestError, ForbiddenError } from '#shared/domain/errors'
import type { CaseMembersRepository, CaseTasksRepository } from '../interfaces'
import type { CaseTask, CaseTaskReminderCreation } from '../domain/entities'
import {
  assertValidCaseTaskDate,
  assertUniqueCaseTaskReminders,
  CaseTaskSource,
  CaseTaskStatus,
  CaseTaskType,
  normalizeCaseTaskTime,
} from '../domain/structures'
import type { DatetimeProvider } from '#shared/interfaces'

type Request = {
  caseId: string
  type: CaseTask['type']
  title: string
  customType?: string
  description: string
  plannedDate: string
  plannedTime?: string
  createdById: string
  assigneeIds?: readonly string[]
  reminders?: readonly CaseTaskReminderCreation[]
  source?: CaseTask['source']
  completionNote?: string
  blocksCaseClosure?: boolean
}

export class CreateCaseTaskUseCase implements UseCase<Request, CaseTask> {
  constructor(
    private readonly caseTasksRepository: CaseTasksRepository,
    private readonly caseMembersRepository: CaseMembersRepository,
    private readonly datetimeProvider: DatetimeProvider,
  ) {}

  async execute(request: Request): Promise<CaseTask> {
    const description = request.description.trim()
    const title = request.title.trim()
    const customType = request.customType?.trim() || undefined
    let assigneeIds = [...new Set(request.assigneeIds ?? [])]
    const now = this.datetimeProvider.now()

    this.validateRequest(request, title, description, customType, assigneeIds, now)
    assertUniqueCaseTaskReminders(request.reminders ?? [])
    const plannedTime = normalizeCaseTaskTime(request.type, request.plannedTime)
    const activeCaseMemberIds = await this.ensureActiveCaseMembers(request.caseId, [
      request.createdById,
      ...assigneeIds,
    ])
    if (request.type !== CaseTaskType.InternalTask) {
      assigneeIds = [...activeCaseMemberIds]
    }

    return this.caseTasksRepository.add({
      caseId: request.caseId,
      type: request.type,
      title,
      customType,
      description,
      plannedDate: request.plannedDate,
      plannedTime,
      status: CaseTaskStatus.ToDo,
      createdById: request.createdById,
      source: request.source ?? CaseTaskSource.Manual,
      blocksCaseClosure:
        request.type === CaseTaskType.InternalTask && request.blocksCaseClosure === true,
      completionNote: request.completionNote?.trim() || undefined,
      assigneeIds,
      reminders: request.reminders ?? [],
    })
  }

  private async ensureActiveCaseMembers(
    caseId: string,
    collaboratorIds: readonly string[],
  ): Promise<readonly string[]> {
    const uniqueCollaboratorIds = [...new Set(collaboratorIds)]
    const activeAssigneeIds =
      await this.caseMembersRepository.findActiveCollaboratorIdsByCaseId(
        caseId,
        uniqueCollaboratorIds,
      )

    if (!activeAssigneeIds.includes(collaboratorIds[0] ?? '')) {
      throw new ForbiddenError('O usuário não possui acesso a este caso.')
    }

    if (collaboratorIds.slice(1).some((id) => !activeAssigneeIds.includes(id))) {
      throw new BadRequestError(
        'Todos os responsáveis devem pertencer à equipe ativa do caso.',
      )
    }

    return this.caseMembersRepository.findActiveCollaboratorIdsByCaseId(caseId, [])
  }

  private validateRequest(
    request: Request,
    title: string,
    description: string,
    customType: string | undefined,
    assigneeIds: readonly string[],
    now: Date,
  ) {
    if (!title) {
      throw new BadRequestError('O título é obrigatório.')
    }

    if (!description) {
      throw new BadRequestError('A descrição é obrigatória.')
    }

    if (request.type === CaseTaskType.InternalTask && assigneeIds.length === 0) {
      throw new BadRequestError('Informe ao menos um responsável.')
    }

    if (request.type === CaseTaskType.InternalTask && assigneeIds.length > 1) {
      throw new BadRequestError('A tarefa deve ter apenas um responsável.')
    }

    if (request.type === CaseTaskType.Other && !customType) {
      throw new BadRequestError('Informe o tipo personalizado do item.')
    }

    assertValidCaseTaskDate(request.plannedDate, now)
  }
}
