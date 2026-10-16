import type { CaseHistoryEntry } from '../domain/entities/case-history-entry'
import type { UseCase } from '#shared/interfaces/use-case'
import { BadRequestError } from '#shared/domain/errors'
import type {
  CaseAccessProvider,
  CaseHistoriesRepository,
  CaseCollaboratorsProvider,
} from '../interfaces'
import type {
  CaseHistoryQuery,
  CaseHistoryPage,
  CaseHistoryCursor,
  CaseHistoryCursorEnvelope,
} from '../domain/structures'
import { CaseAccessIntent, CaseHistoryCategory } from '../domain/structures'
export class ListCaseHistoryUseCase
  implements UseCase<CaseHistoryQuery, CaseHistoryPage>
{
  constructor(
    private readonly access: CaseAccessProvider,
    private readonly histories: CaseHistoriesRepository,
    private readonly collaborators: CaseCollaboratorsProvider,
  ) {}
  async execute(request: CaseHistoryQuery): Promise<CaseHistoryPage> {
    await this.access.authorize({ ...request, intent: CaseAccessIntent.ReadContent })
    const search = request.search?.trim() ?? ''
    const limit = request.limit ?? 20
    this.validateQuery(request, search, limit)
    const before = this.decodeCursor(request, search)
    const rows = await this.histories.listByCaseId({
      caseId: request.caseId,
      category: request.category,
      search,
      before,
      limit: limit + 1,
    })
    const items = rows.slice(0, limit)
    const enriched = await this.enrichActors(items)
    const last = items.at(-1)
    return {
      items: enriched,
      nextCursor:
        rows.length > limit && last
          ? this.encodeCursor({
              caseId: request.caseId,
              category: request.category,
              search,
              before: { occurredAt: last.occurredAt.toISOString(), id: last.id },
            })
          : undefined,
    }
  }
  private validateQuery(request: CaseHistoryQuery, search: string, limit: number): void {
    if (
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 50 ||
      search.length > 200 ||
      (request.category !== undefined &&
        !Object.values(CaseHistoryCategory).includes(request.category))
    )
      throw new BadRequestError('Filtro do histórico inválido.')
  }
  private async enrichActors(
    items: readonly CaseHistoryEntry[],
  ): Promise<readonly CaseHistoryEntry[]> {
    const actors = await this.collaborators.findByIds([
      ...new Set(
        items
          .filter((item) => item.actorId && !item.actorName)
          .map((item) => item.actorId as string),
      ),
    ])
    return items.map((item) => ({
      ...item,
      actorName:
        item.actorName ??
        actors.find((actor) => actor.collaboratorId === item.actorId)?.professionalName,
    }))
  }
  private encodeCursor(cursor: CaseHistoryCursorEnvelope): string {
    return btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(cursor))))
      .replaceAll('+', '-')
      .replaceAll('/', '_')
      .replace(/=+$/, '')
  }
  private decodeCursor(
    request: CaseHistoryQuery,
    search: string,
  ): CaseHistoryCursor | undefined {
    if (request.cursor === undefined) return undefined
    try {
      if (request.cursor.length > 2048 || !/^[A-Za-z0-9_-]+$/.test(request.cursor))
        throw new BadRequestError('Cursor inválido.')
      const value = JSON.parse(
        new TextDecoder().decode(
          Uint8Array.from(
            atob(request.cursor.replaceAll('-', '+').replaceAll('_', '/')),
            (char) => char.charCodeAt(0),
          ),
        ),
      )
      this.assertEnvelope(value, request, search)
      return this.parseBoundary(value.before)
    } catch {
      throw new BadRequestError('Cursor inválido para este histórico.')
    }
  }
  private assertEnvelope(
    value: CaseHistoryCursorEnvelope,
    request: CaseHistoryQuery,
    search: string,
  ): void {
    if (
      !value ||
      typeof value !== 'object' ||
      Array.isArray(value) ||
      Object.keys(value).some(
        (key) => !['caseId', 'category', 'search', 'before'].includes(key),
      )
    )
      throw new BadRequestError('Cursor inválido.')
    if (
      value.caseId !== request.caseId ||
      value.category !== request.category ||
      value.search !== search
    )
      throw new BadRequestError('Cursor de outro contexto.')
  }
  private parseBoundary(before: CaseHistoryCursorEnvelope['before']): CaseHistoryCursor {
    if (
      !before ||
      typeof before !== 'object' ||
      Array.isArray(before) ||
      Object.keys(before).some((key) => !['occurredAt', 'id'].includes(key))
    )
      throw new BadRequestError('Posição inválida.')
    if (
      typeof before.id !== 'string' ||
      !/^(opening|team|document|record):[^:]+$/.test(before.id) ||
      typeof before.occurredAt !== 'string'
    )
      throw new BadRequestError('Posição inválida.')
    const date = new Date(before.occurredAt)
    if (!Number.isFinite(date.getTime()) || date.toISOString() !== before.occurredAt)
      throw new BadRequestError('Data inválida.')
    return { id: before.id, occurredAt: date }
  }
}
