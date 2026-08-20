import type {
  IntakeListResponse,
  IntakeService as IntakeRestService,
} from '@hms/core/intake/interfaces'
import type { Intake } from '@hms/core/intake/domain/entities'
import type { IntakeListQuery } from '@hms/core/intake/domain/structures'
import type { IntakeListItem } from '@hms/core/intake/domain/structures'
import type { ResponsibleListProjection } from '@hms/core/identity/domain/structures'
import type { RestClient } from '@hms/core/shared/interfaces'

function createIntakesPath(query: IntakeListQuery = {}) {
  const searchParams = new URLSearchParams()
  const queryEntries: Array<[string, string | number | null | undefined]> = [
    ['search', query.search],
    ['status', query.status],
    ['responsibleId', query.responsibleId],
    ['origin', query.origin],
    ['contactChannel', query.contactChannel],
    ['registeredFrom', query.registeredFrom],
    ['registeredTo', query.registeredTo],
    ['page', query.page],
    ['pageSize', query.pageSize],
  ]

  for (const [key, value] of queryEntries) {
    if (value != null) searchParams.set(key, String(value))
  }

  const queryString = searchParams.toString()

  return queryString ? `/intakes?${queryString}` : '/intakes'
}

export const IntakeService = (restClient: RestClient): IntakeRestService => {
  return {
    listIntakes(query) {
      return restClient.get<IntakeListResponse<IntakeListItem>>(createIntakesPath(query))
    },

    listIntakeResponsibles() {
      return restClient.get<readonly ResponsibleListProjection[]>('/intakes/responsibles')
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

    retryIntakeConsultationScheduling(intakeId, request) {
      return restClient.post<Intake>(
        `/intakes/${intakeId}/consultation-scheduling/retry`,
        request,
      )
    },

    transitionIntakeStatus(intakeId, request) {
      return restClient.patch<Intake>(`/intakes/${intakeId}/status`, request)
    },

    closeIntakeWithoutContract(intakeId, request) {
      return restClient.post<Intake>(`/intakes/${intakeId}/close`, request)
    },

    updateIntake(intakeId, request) {
      return restClient.patch<Intake>(`/intakes/${intakeId}`, request)
    },
  }
}
