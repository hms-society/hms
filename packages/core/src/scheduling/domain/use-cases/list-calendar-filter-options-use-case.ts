import type { CollaboratorProfile as CollaboratorProfileValue } from '#identity/domain/structures'
import type { UseCase } from '#shared/interfaces'

import { AppointmentActionForbiddenError } from '../errors'
import type { CalendarIdentityProvider } from '#shared/interfaces'
import type { AppointmentsRepository, SchedulesRepository } from '../../interfaces'

type Request = {
  actor: {
    collaboratorId: string
    profile: CollaboratorProfileValue
    status?: string
  }
  kind: 'client' | 'lawyer'
  search?: string
  cursor?: string
}

type Response = {
  items: readonly { id: string; name: string }[]
  nextCursor?: string
}

const PAGE_SIZE = 20
const MAX_IDENTITY_SCAN_PAGES = 5

export class ListCalendarFilterOptionsUseCase implements UseCase<Request, Response> {
  constructor(
    private readonly schedulesRepository: SchedulesRepository,
    private readonly appointmentsRepository: AppointmentsRepository,
    private readonly identityProvider: CalendarIdentityProvider,
  ) {}

  async execute(request: Request): Promise<Response> {
    assertReadAccess(request.actor)
    const schedules = await this.schedulesRepository.listByCollaboratorIds(
      request.actor.profile === 'lawyer' ? [request.actor.collaboratorId] : undefined,
    )
    const scope = {
      scheduleIds: schedules.map((schedule) => schedule.id),
      ...(request.actor.profile === 'lawyer'
        ? { lawyerId: request.actor.collaboratorId }
        : {}),
    }
    const search = request.search?.trim() ?? ''
    const items: { id: string; name: string }[] = []
    const seenIds = new Set<string>()
    const seenCursors = new Set<string>()
    let cursor = request.cursor
    let nextCursor: string | undefined
    let scanPages = 0

    while (items.length < PAGE_SIZE && scanPages < MAX_IDENTITY_SCAN_PAGES) {
      scanPages += 1
      const identityResult = request.kind === 'client'
        ? await this.identityProvider.searchClients(search, cursor, PAGE_SIZE - items.length)
        : await this.identityProvider.searchLawyers(search, cursor, PAGE_SIZE - items.length)
      const candidates = identityResult.items.filter((item) => !seenIds.has(item.id))
      candidates.forEach((item) => seenIds.add(item.id))
      const visibleIds = await this.appointmentsRepository.filterFacetIdsInScope(
        request.kind,
        scope,
        candidates.map((item) => item.id),
      )
      const visible = new Set(visibleIds)
      items.push(...candidates.filter((item) => visible.has(item.id)))
      nextCursor = identityResult.nextCursor
      if (items.length >= PAGE_SIZE || !nextCursor || seenCursors.has(nextCursor)) break
      seenCursors.add(nextCursor)
      cursor = nextCursor
    }

    return {
      items: items.slice(0, PAGE_SIZE),
      ...(nextCursor ? { nextCursor } : {}),
    }
  }
}

function assertReadAccess(actor: Request['actor']): void {
  if (actor.status && actor.status !== 'active') throw new AppointmentActionForbiddenError()
  if (!['admin', 'attendant', 'lawyer', 'paralegal', 'supervisor'].includes(actor.profile)) {
    throw new AppointmentActionForbiddenError()
  }
}
