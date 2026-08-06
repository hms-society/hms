import type { RestClient } from '@hms/core/shared/interfaces'

export function documentService(client: RestClient){
    return{
        listClientDocument: async(clientId: string) => {
            return client.get(`/document-batches/clients/${clientId}`)
        }
    }
}