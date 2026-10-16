import type { AxiosRestClient } from '@/rest/axios/axios-rest-client'

import type {
  CalendarEvent,
  CalendarQuery,
  AppointmentDetails,
  AvailableSlot,
} from '@hms/core/scheduling/domain/structures'

export type CalendarAppointmentResponse = Omit<
  Extract<CalendarEvent, { kind: 'appointment' }>,
  'startsAt' | 'endsAt' | 'cancelledAt' | 'consultationStartedAt' | 'updatedAt'
> & {
  startsAt: string
  endsAt: string
  cancelledAt?: string
  consultationStartedAt?: string
  updatedAt: string
}

export type CalendarBlockResponse = Extract<CalendarEvent, { kind: 'block' }>
export type CalendarEventResponse = CalendarAppointmentResponse | CalendarBlockResponse

export type AppointmentDetailsResponse = Omit<
  AppointmentDetails,
  | 'startsAt'
  | 'endsAt'
  | 'cancelledAt'
  | 'consultationStartedAt'
  | 'updatedAt'
  | 'changes'
> & {
  startsAt: string
  endsAt: string
  cancelledAt?: string
  consultationStartedAt?: string
  updatedAt: string
  changes: Array<
    Omit<
      AppointmentDetails['changes'][number],
      | 'occurredAt'
      | 'previousStartsAt'
      | 'previousEndsAt'
      | 'newStartsAt'
      | 'newEndsAt'
      | 'previousRevision'
      | 'resultingRevision'
      | 'publishedAt'
    > & {
      occurredAt: string
      previousStartsAt: string
      previousEndsAt: string
      newStartsAt?: string
      newEndsAt?: string
      previousRevision: string
      resultingRevision: string
      publishedAt?: string
    }
  >
}

export type CalendarFilterOption = {
  id: string
  name: string
}

export type CalendarFilterOptionsResponse = {
  items: CalendarFilterOption[]
  nextCursor?: string
}

export type AvailableSlotResponse = Omit<AvailableSlot, 'startsAt' | 'endsAt'> & {
  startsAt: string
  endsAt: string
}

export class SchedulingRequestError extends Error {
  readonly statusCode: number

  constructor(statusCode: number, message: string) {
    super(message)
    this.name = 'SchedulingRequestError'
    this.statusCode = statusCode
  }
}

export function unwrapSchedulingResponse<Body>(response: {
  isFailure: boolean
  statusCode: number
  errorMessage: string
  body: Body
}) {
  if (response.isFailure) {
    throw new SchedulingRequestError(response.statusCode, response.errorMessage)
  }

  return response.body
}

export type CreateScheduleRequest = {
  collaboratorId: string
  defaultDurationMinutes: number
  weeklyAvailability: unknown
}

export type AddBlockRequest = {
  scheduleId: string
  startsOn: string
  endsOn: string
  reason?: string
}

export type UpdateAvailabilityRequest = {
  scheduleId: string
  weeklyAvailability: unknown
}

export const SchedulingService = (restClient: ReturnType<typeof AxiosRestClient>) => {
  return {
    async listCalendar(query: CalendarQuery) {
      const searchParams = new URLSearchParams({
        view: query.view,
        date: query.date,
        event: query.event,
      })

      if (query.clientId) searchParams.set('clientId', query.clientId)
      if (query.lawyerId) searchParams.set('lawyerId', query.lawyerId)

      return restClient.get<CalendarEventResponse[]>(
        `/scheduling/calendar?${searchParams.toString()}`,
      )
    },

    async listCalendarFilterOptions(
      kind: 'client' | 'lawyer',
      search?: string,
      cursor?: string,
    ) {
      const searchParams = new URLSearchParams({ kind })
      if (search) searchParams.set('search', search)
      if (cursor) searchParams.set('cursor', cursor)

      return restClient.get<CalendarFilterOptionsResponse>(
        `/scheduling/calendar/filters?${searchParams.toString()}`,
      )
    },

    async getAppointmentDetails(appointmentId: string) {
      return restClient.get<AppointmentDetailsResponse>(
        `/scheduling/appointments/${appointmentId}`,
      )
    },

    async listRescheduleSlots(appointmentId: string, date: string, lawyerId?: string) {
      const searchParams = new URLSearchParams({ date })
      if (lawyerId) searchParams.set('lawyerId', lawyerId)

      return restClient.get<AvailableSlotResponse[]>(
        `/scheduling/appointments/${appointmentId}/slots?${searchParams.toString()}`,
      )
    },

    async cancelAppointment(appointmentId: string, expectedRevision: string) {
      return restClient.patch<AppointmentDetailsResponse>(
        `/scheduling/appointments/${appointmentId}/cancel`,
        { expectedRevision },
      )
    },

    async rescheduleAppointment(
      appointmentId: string,
      expectedRevision: string,
      startsAt: string,
      lawyerId?: string,
    ) {
      return restClient.patch<AppointmentDetailsResponse>(
        `/scheduling/appointments/${appointmentId}/reschedule`,
        { expectedRevision, startsAt, lawyerId },
      )
    },

    async getByCollaborator(collaboratorId: string) {
      return restClient.get<any>(`/schedules/collaborator/${collaboratorId}`)
    },

    async createSchedule(request: CreateScheduleRequest) {
      return restClient.post<any>('/schedules', request)
    },

    async updateAvailability(request: UpdateAvailabilityRequest) {
      return restClient.put<any>('/schedules/availability', request)
    },

    async addBlock(request: AddBlockRequest) {
      return restClient.post<any>('/schedules/blocked-periods', request)
    },

    async removeBlock(blockId: string) {
      return restClient.delete<any>(`/schedules/blocked-periods/${blockId}`)
    },
    async updateDuration(scheduleId: string, defaultDurationMinutes: number) {
      return restClient.put<any>('/schedules/duration', {
        scheduleId,
        defaultDurationMinutes,
      })
    },
  }
}
