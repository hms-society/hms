import type { AuditEvent, AuditEventJsonValue } from '../domain/structures'
import type {
  AuditLogExportWriter,
  AuditLogsRepository,
  ListAuditLogsQuery,
} from '../interfaces'

export type ExportAuditLogsRequest = {
  query: Omit<ListAuditLogsQuery, 'page' | 'limit'>
  format: 'csv' | 'json'
  actorId: string
  actorProfile: string
}

export type ExportAuditLogsResult = {
  content: string
  contentType: 'text/csv' | 'application/json'
  fileName: string
}

export class ExportAuditLogsUseCase {
  constructor(
    private readonly auditLogsRepository: AuditLogsRepository,
    private readonly exportWriter: AuditLogExportWriter,
  ) {}

  async execute(request: ExportAuditLogsRequest): Promise<ExportAuditLogsResult> {
    const firstPage = await this.auditLogsRepository.list({
      ...request.query,
      page: 1,
      limit: 100,
    })
    const events = [...firstPage.data]

    for (let page = 2; events.length < firstPage.total; page += 1) {
      const nextPage = await this.auditLogsRepository.list({
        ...request.query,
        page,
        limit: 100,
      })
      events.push(...nextPage.data)
      if (nextPage.data.length === 0) break
    }

    await this.exportWriter.recordExport({
      actorId: request.actorId,
      actorProfile: request.actorProfile,
      format: request.format,
      filters: this.serializeFilters(request.query),
      exportedCount: events.length,
    })

    return request.format === 'csv'
      ? {
          content: this.toCsv(events),
          contentType: 'text/csv',
          fileName: 'audit-logs.csv',
        }
      : {
          content: JSON.stringify(events, null, 2),
          contentType: 'application/json',
          fileName: 'audit-logs.json',
        }
  }

  private serializeFilters(query: ExportAuditLogsRequest['query']): AuditEventJsonValue {
    return Object.fromEntries(
      Object.entries(query).map(([key, value]) => [
        key,
        value instanceof Date ? value.toISOString() : (value ?? null),
      ]),
    )
  }

  private toCsv(events: readonly AuditEvent[]) {
    const headers = [
      'id',
      'occurredAt',
      'actorId',
      'actorProfile',
      'entityType',
      'entityId',
      'action',
      'origin',
      'status',
    ]
    const rows = events.map((event) =>
      [
        event.id,
        event.occurredAt.toISOString(),
        event.actorId,
        event.actorProfile,
        event.entityType,
        event.entityId,
        event.action,
        event.origin,
        event.status,
      ].map((value) => this.escapeCsv(value)),
    )
    return [headers, ...rows].map((row) => row.join(',')).join('\n')
  }

  private escapeCsv(value: string | undefined) {
    const normalized = value ?? ''
    return /[",\n]/.test(normalized)
      ? `"${normalized.replaceAll('"', '""')}"`
      : normalized
  }
}
