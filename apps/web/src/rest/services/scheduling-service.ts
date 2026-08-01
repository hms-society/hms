import type { AxiosRestClient } from '@/rest/axios/axios-rest-client'

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
