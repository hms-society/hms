import { Injectable } from '@nestjs/common'
import { and, count, desc, eq, gte, lte } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import type { AuditEvent, AuditEventEntityType } from '@hms/core/shared/domain/structures'
import type {
  AuditLogExportRecord,
  AuditLogsRepository,
  ListAuditLogsQuery,
  PaginatedAuditEvents,
} from '@hms/core/shared/interfaces'

import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'
import { auditLogModel } from '@/identity/database/drizzle/models/audit-model'
import { auditEventModel } from '@/shared/database/drizzle/models/audit-event-model'

@Injectable()
export class DrizzleAuditLogsRepository
  extends DrizzleRepository
  implements AuditLogsRepository
{
  // biome-ignore lint/complexity/noUselessConstructor: Nest needs the dependency metadata on this provider.
  constructor(drizzle: DrizzleClient) {
    super(drizzle)
  }

  async list(query: ListAuditLogsQuery): Promise<PaginatedAuditEvents> {
    const offset = (query.page - 1) * query.limit
    const conditions: SQL[] = []
    if (query.from) conditions.push(gte(auditEventModel.occurredAt, query.from))
    if (query.to) conditions.push(lte(auditEventModel.occurredAt, query.to))
    if (query.entityType)
      conditions.push(eq(auditEventModel.entityType, query.entityType))
    if (query.actorId) conditions.push(eq(auditEventModel.actorId, query.actorId))
    if (query.action) conditions.push(eq(auditEventModel.action, query.action))
    if (query.origin) conditions.push(eq(auditEventModel.origin, query.origin))
    if (query.status) conditions.push(eq(auditEventModel.status, query.status))
    const where = conditions.length ? and(...conditions) : undefined
    const [rows, [{ total }]] = await Promise.all([
      this.database
        .select()
        .from(auditEventModel)
        .where(where)
        .orderBy(desc(auditEventModel.occurredAt))
        .limit(query.limit)
        .offset(offset),
      this.database.select({ total: count() }).from(auditEventModel).where(where),
    ])

    return {
      data: rows.map((row) => this.mapAuditEvent(row)),
      total: Number(total),
    }
  }

  async findById(id: string): Promise<AuditEvent | undefined> {
    const [event] = await this.database
      .select()
      .from(auditEventModel)
      .where(eq(auditEventModel.id, id))
      .limit(1)

    return event ? this.mapAuditEvent(event) : undefined
  }

  async recordExport(record: AuditLogExportRecord): Promise<void> {
    await this.database.insert(auditLogModel).values({
      idUsuario: record.actorId,
      perfilUsuario: record.actorProfile,
      entidade: 'audit_log_export',
      idEntidade: record.actorId,
      campoAlterado: 'exported',
      valorAnterior: null,
      valorNovo: JSON.stringify({
        format: record.format,
        filters: record.filters,
        exportedCount: record.exportedCount,
      }),
    })
  }

  private mapAuditEvent(row: typeof auditEventModel.$inferSelect): AuditEvent {
    return {
      id: row.id,
      occurredAt: row.occurredAt,
      actorId: row.actorId ?? undefined,
      actorProfile: row.actorProfile ?? undefined,
      entityType: this.entityType(row.entityType),
      entityId: row.entityId ?? undefined,
      action: row.action,
      origin: row.origin as AuditEvent['origin'],
      status: row.status as AuditEvent['status'],
      beforeData: this.parseAuditData(row.beforeData),
      afterData: this.parseAuditData(row.afterData),
      metadata: row.metadata as AuditEvent['metadata'],
      ipAddress: row.ipAddress ?? undefined,
      justification: row.justification ?? undefined,
    }
  }

  private entityType(value: string): AuditEventEntityType {
    const knownTypes: AuditEventEntityType[] = [
      'intake',
      'case',
      'document',
      'piece',
      'checklist',
      'task',
      'deadline',
      'permission',
      'client',
      'third_party',
      'external_access',
      'document_validation',
      'document_exception',
      'audit_log_export',
    ]
    return knownTypes.includes(value as AuditEventEntityType)
      ? (value as AuditEventEntityType)
      : 'permission'
  }

  private parseAuditData(value: unknown): AuditEvent['beforeData'] {
    if (
      value &&
      typeof value === 'object' &&
      'value' in value &&
      typeof value.value === 'string'
    ) {
      try {
        return JSON.parse(value.value) as AuditEvent['beforeData']
      } catch {
        return value.value
      }
    }

    return value as AuditEvent['beforeData']
  }
}
