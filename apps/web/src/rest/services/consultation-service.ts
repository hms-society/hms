import type { FinalizeConsultationAttendanceDto } from '@hms/validation/consultation'
import type { AxiosRestClient } from '@/rest/axios/axios-rest-client'

export type CreateConsultationRequest = {
  clientId: string
  assignedLawyerId?: string
  intakeId?: string
  modality: 'PRESENTIAL' | 'VIRTUAL'
  channel?: string
  notes?: string
}

export type UpdateConsultationRequest = Partial<CreateConsultationRequest>

export type CompleteConsultationRequest = {
  legalAreaId?: string
  legalTopicId?: string
  primaryLegalQuestion?: string
  guidanceProvided?: string
  notes?: string
  viability?: string
  decision?: string
  relevantFacts?: Array<{
    id?: string
    description: string
    date?: string
  }>
  potentialLegalRequests?: Array<{
    id?: string
    title: string
    summary?: string
  }>
}

export const ConsultationService = (restClient: ReturnType<typeof AxiosRestClient>) => {
  return {
    async getConsultationById(consultationId: string) {
      return restClient.get<any>(`/consultations/${consultationId}`)
    },

    async getConsultationByIntakeId(intakeId: string) {
      return restClient.get<any>(`/consultations/by-intake/${intakeId}`)
    },

    async listConsultations(params?: {
      lawyerId?: string
      clientId?: string
      status?: string
    }) {
      const searchParams = new URLSearchParams(
        params as Record<string, string>,
      ).toString()
      const url = searchParams ? `/consultations?${searchParams}` : '/consultations'
      return restClient.get<any>(url)
    },

    async createConsultation(request: CreateConsultationRequest) {
      return restClient.post<any>('/consultations', request)
    },

    async updateConsultation(consultationId: string, request: UpdateConsultationRequest) {
      return restClient.put<any>(`/consultations/${consultationId}`, request)
    },

    async markNoShow(consultationId: string) {
      return restClient.patch<any>(`/consultations/${consultationId}/no-show`)
    },

    async rescheduleConsultation(consultationId: string) {
      return restClient.patch<any>(`/consultations/${consultationId}/reschedule`)
    },

    async completeConsultation(consultationId: string) {
      return restClient.patch<any>(`/consultations/${consultationId}/complete`)
    },

    async finalizeAttendance(
      consultationId: string,
      request: FinalizeConsultationAttendanceDto,
    ) {
      return restClient.patch<any>(
        `/consultations/${consultationId}/attendance/finalize`,
        request,
      )
    },

    async editAttendance(consultationId: string) {
      return restClient.patch<any>(`/consultations/${consultationId}/attendance/edit`)
    },

    async cancelConsultation(consultationId: string, reason?: string) {
      return restClient.patch<any>(`/consultations/${consultationId}/cancel`, { reason })
    },
  }
}
