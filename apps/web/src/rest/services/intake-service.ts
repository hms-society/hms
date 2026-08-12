import type { IntakeService as IntakeRestService } from '@hms/core/intake/interfaces'
import type { Intake } from '@hms/core/intake/domain/entities'
import type { RestClient } from '@hms/core/shared/interfaces'

export const IntakeService = (restClient: RestClient): IntakeRestService => {
  return {
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
