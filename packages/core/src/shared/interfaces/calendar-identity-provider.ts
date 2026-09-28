import type { CollaboratorSummary } from '#identity/domain/entities'

export interface CalendarIdentityProvider {
  getActor(id: string): Promise<CollaboratorSummary | undefined>
  getClients(ids: readonly string[]): Promise<ReadonlyMap<string, { name: string }>>
  getLawyers(
    ids: readonly string[],
  ): Promise<ReadonlyMap<string, { name: string; active: boolean }>>
  getCollaborators(ids: readonly string[]): Promise<ReadonlyMap<string, { name: string }>>
  searchClients(
    search: string,
    cursor: string | undefined,
    limit: number,
  ): Promise<{ items: readonly { id: string; name: string }[]; nextCursor?: string }>
  searchLawyers(
    search: string,
    cursor: string | undefined,
    limit: number,
  ): Promise<{ items: readonly { id: string; name: string }[]; nextCursor?: string }>
}
