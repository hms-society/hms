import type { IntakeService as IntakeRestService } from '@hms/core/intake/interfaces'
import type { Intake } from '@hms/core/intake/domain/entities'
import type { IntakeListQuery } from '@hms/core/intake/domain/structures'
import type { RestClient } from '@hms/core/shared/interfaces'

const buildIntakeListQuery = (query?: IntakeListQuery): string => {
  if (!query) return ''

  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue

    if (Array.isArray(value)) {
      for (const item of value) params.append(key, String(item))
      continue
    }

    params.append(key, String(value))
  }

  const search = params.toString()
  return search ? `?${search}` : ''
}

export const IntakeService = (restClient: RestClient): IntakeRestService => {
  return {
    listIntakes(query) {
      return restClient.get(`/intakes${buildIntakeListQuery(query)}`)
    },

    listIntakeResponsibles() {
      return restClient.get('/intakes/responsibles')
    },

    listClientIntake(clientId) {
      return restClient.get<Intake[]>(`/intakes/clients/${clientId}`)
    },

    getIntake(intakeId) {
      return restClient.get<Intake>(`/intakes/${intakeId}`)
    },

    registerIntake(request) {
      return restClient.post<Intake>('/intakes', request)
    },

    transitionIntakeStatus(intakeId, request) {
      return restClient.patch<Intake>(`/intakes/${intakeId}/status`, request)
    },

    closeIntakeWithoutContract(intakeId, request) {
      return restClient.post<Intake>(`/intakes/${intakeId}/close`, request)
    },
  }
}