import type { CommunicationService as CommunicationRestService } from '@hms/core/communication/interfaces'
import type {
  ClientCommunicationSummary,
  CommunicationRecord,
  SendCommunicationPayload,
} from '@hms/core/communication/domain/structures'
import type { RestClient } from '@hms/core/shared/interfaces'

export type { CommunicationRecord, SendCommunicationPayload }

export const CommunicationService = (client: RestClient): CommunicationRestService => ({
  listClientCommunicationSummaries() {
    return client.get<ClientCommunicationSummary[]>('/communications/summary')
  },

  listClientCommunications(clientId) {
    return client.get<CommunicationRecord[]>(`/communications/clients/${clientId}`)
  },

  sendCommunication(payload) {
    return client.post<CommunicationRecord>('/communications/send', payload)
  },
})
