import type { AxiosRestClient } from '@/rest/axios/axios-rest-client'

export type CreateConsultationRequest = {
  clientId: string
  assignedLawyerId?: string
  intakeId?: string
  modality: 'PRESENTIAL' | 'VIRTUAL'
  channel?: string
  primaryLegalQuestion?: string
  notes?: string
}

export type UpdateConsultationRequest = Partial<CreateConsultationRequest>

export const ConsultationService = (restClient: ReturnType<typeof AxiosRestClient>) => {
  return {
    async getConsultationById(consultationId: string) {
      return restClient.get<any>(`/consultations/${consultationId}`)
    },

    async listConsultations(params?: { lawyerId?: string; clientId?: string; status?: string }) {
      const searchParams = new URLSearchParams(params as Record<string, string>).toString()
      const url = searchParams ? `/consultations?${searchParams}` : '/consultations'
      return restClient.get<any>(url)
    },

    async createConsultation(request: CreateConsultationRequest) {
      return restClient.post<any>('/consultations', request)
    },

    async updateConsultation(consultationId: string, request: UpdateConsultationRequest) {
      return restClient.put<any>(`/consultations/${consultationId}`, request)
    },

    async startConsultation(consultationId: string) {
      return restClient.patch<any>(`/consultations/${consultationId}/start`)
    },

    async markNoShow(consultationId: string) {
      return restClient.patch<any>(`/consultations/${consultationId}/no-show`)
    },

    async rescheduleConsultation(consultationId: string, newDate: string) {
      return restClient.patch<any>(`/consultations/${consultationId}/reschedule`, { newDate })
    },

    async completeConsultation(consultationId: string, summary?: string) {
      return restClient.patch<any>(`/consultations/${consultationId}/complete`, { summary })
    },

    async cancelConsultation(consultationId: string, reason?: string) {
      return restClient.patch<any>(`/consultations/${consultationId}/cancel`, { reason })
    },
  }
}