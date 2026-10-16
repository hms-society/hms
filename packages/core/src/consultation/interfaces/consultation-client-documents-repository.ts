import type { Consultation } from '../domain/entities'

export interface ConsultationClientDocumentsRepository {
  findByClientId(clientId: string): Promise<readonly Consultation[]>
}
