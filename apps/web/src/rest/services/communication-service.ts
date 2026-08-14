import { RestResponse } from '@hms/core/shared/responses/rest-response'
import type { RestClient } from '#shared/interfaces'

export type CommunicationRecord = {
  id: string
  channel: 'whatsapp' | 'email' | 'phone'
  direction: 'inbound' | 'outbound'
  content: string
  createdAt: string
  author: string
}

export type SendCommunicationPayload = {
  clientId: string
  content: string
  channel: 'whatsapp' | 'email' | 'phone'
}

export function CommunicationService(client: RestClient) {
  return {
    listClientCommunications: async (clientId: string) => {
      const response: any = await client.get(`/communications/clients/${clientId}`)

      // Se o client.get já retorna o formato da aplicação (com .body e .isFailure)
      if (response && response.isFailure !== undefined) {
        return response
      }

      // Se for uma resposta bruta do Axios (com .data)
      return new RestResponse(response)
    },

    sendCommunication: async (payload: SendCommunicationPayload) => {
      const response: any = await client.post('/communications/send', payload)

      if (response && response.isFailure !== undefined) {
        return response
      }

      return new RestResponse(response)
    },
  }
}
