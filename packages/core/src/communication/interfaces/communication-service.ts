import type { RestResponse } from '#shared/responses/rest-response.ts'
import type {
  ClientCommunicationSummary,
  CommunicationRecord,
  SendCommunicationPayload,
} from '../domain/structures'

export interface CommunicationService {
  listClientCommunicationSummaries(): Promise<RestResponse<ClientCommunicationSummary[]>>
  listClientCommunications(clientId: string): Promise<RestResponse<CommunicationRecord[]>>
  sendCommunication(
    payload: SendCommunicationPayload,
  ): Promise<RestResponse<CommunicationRecord>>
}
