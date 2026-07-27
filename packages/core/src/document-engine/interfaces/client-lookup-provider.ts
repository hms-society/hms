import type { ClientLookupInput, ClientMatchCandidate } from '../domain/structures'

export interface ClientLookupProvider {
  findCandidates(input: ClientLookupInput): Promise<ClientMatchCandidate[]>
}
