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

export type UpdateClientQualificationRequest = {
  name?: string
  legalName?: string
  tradeName?: string
  taxIdValue?: string
  phone?: string
  email?: string
  origin?: string
  linkedThirdParty?: string
  hmsResponsible?: string
  rg?: string
  birthDate?: string
  maritalStatus?: string
  nationality?: string
  profession?: string
  stateRegistration?: string
  constitutionDate?: string
  legalNature?: string
  legalRepresentative?: string
  representativeRole?: string
  zipCode?: string
  street?: string
  number?: string
  complement?: string
  district?: string
  city?: string
  state?: string
}

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

    async rescheduleConsultation(consultationId: string) {
      return restClient.patch<any>(`/consultations/${consultationId}/reschedule`)
    },

    async updateQualification(
      consultationId: string,
      request: UpdateClientQualificationRequest,
    ) {
      return restClient.patch<any>(
        `/consultations/${consultationId}/qualification`,
        request,
      )
    },

    async completeConsultation(
      consultationId: string,
      request: CompleteConsultationRequest,
    ) {
      return restClient.patch<any>(
        `/consultations/${consultationId}/complete`,
        request,
      )
    },

    async cancelConsultation(consultationId: string, reason?: string) {
      return restClient.patch<any>(`/consultations/${consultationId}/cancel`, { reason })
    },
  }
}