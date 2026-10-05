import { Injectable } from '@nestjs/common'
import type { AuditEvent, AuditEventEntityType } from '@hms/core/shared/domain/structures'
import type {
  AuditLogsRepository,
  ListAuditLogsQuery,
  PaginatedAuditEvents,
} from '@hms/core/shared/interfaces'

import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'
import { auditLogModel } from '@/identity/database/drizzle/models/audit-model'
import {
  documentAuditModel,
  documentExternalAccessLogModel,
} from '@/document-production/database/drizzle/models/document-security-model'
import { documentExceptionAuditLogModel } from '@/document-engine/database/drizzle/models/document-exception-audit-log-model'
import { documentValidationLogModel } from '@/document-engine/database/drizzle/models/document-validation-log-model'

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
    const events = await this.loadEvents()
    const filtered = events
      .filter((event) => this.matchesQuery(event, query))
      .sort((left, right) => right.occurredAt.getTime() - left.occurredAt.getTime())

    const offset = (query.page - 1) * query.limit
    return {
      data: filtered.slice(offset, offset + query.limit),
      total: filtered.length,
    }
  }

  async findById(id: string): Promise<AuditEvent | undefined> {
    const events = await this.loadEvents()
    return events.find((event) => event.id === id)
  }

  private async loadEvents(): Promise<AuditEvent[]> {
    const [globalLogs, documentLogs, validationLogs, exceptionLogs, externalLogs] =
      await Promise.all([
        this.database.select().from(auditLogModel),
        this.database.select().from(documentAuditModel),
        this.database.select().from(documentValidationLogModel),
        this.database.select().from(documentExceptionAuditLogModel),
        this.database.select().from(documentExternalAccessLogModel),
      ])

    return [
      ...globalLogs.map((log) => ({
        id: log.id,
        occurredAt: log.timestamp,
        actorId: log.idUsuario,
        actorProfile: log.perfilUsuario,
        entityType: this.entityType(log.entidade),
        entityId: log.idEntidade,
        action: log.campoAlterado,
        beforeData: this.parseJson(log.valorAnterior),
        afterData: this.parseJson(log.valorNovo),
      })),
      ...documentLogs.map((log) => ({
        id: log.id,
        occurredAt: log.createdAt,
        actorId: log.usuarioResponsavelId,
        entityType: 'document' as const,
        entityId: log.documentoId,
        action: 'access_classification_changed',
        beforeData: log.valorAnterior,
        afterData: log.valorNovo,
      })),
      ...validationLogs.map((log) => ({
        id: log.id,
        occurredAt: log.createdAt,
        actorId: log.actorId ?? undefined,
        entityType: 'document_validation' as const,
        entityId: log.documentFileId,
        action: log.action,
        status: [
          'processing_failure',
          'illegible',
          'incomplete',
          'duplicate',
          'not_corresponding',
        ].includes(log.status ?? '')
          ? ('failure' as const)
          : ('success' as const),
        metadata: this.toJsonValue({
          decision: log.decision,
          reason: log.reason,
          message: log.message,
          metadata: log.metadata,
        }),
      })),
      ...exceptionLogs.map((log) => ({
        id: log.id,
        occurredAt: log.createdAt,
        actorId: log.userId,
        entityType: 'document_exception' as const,
        entityId: log.documentExceptionId,
        action: log.action,
        metadata: this.toJsonValue(log.metadata),
      })),
      ...externalLogs.map((log) => ({
        id: log.id,
        occurredAt: log.dataHora,
        entityType: 'external_access' as const,
        entityId: log.documentoId,
        action: log.motivoNegativa ? 'access_denied' : 'accessed',
        status: log.motivoNegativa ? ('failure' as const) : ('success' as const),
        ipAddress: log.ipOrigem,
        metadata: this.toJsonValue({ reason: log.motivoNegativa }),
      })),
    ]
  }

  private matchesQuery(event: AuditEvent, query: ListAuditLogsQuery) {
    return (
      (!query.from || event.occurredAt >= query.from) &&
      (!query.to || event.occurredAt <= query.to) &&
      (!query.entityType || event.entityType === query.entityType) &&
      (!query.actorId || event.actorId === query.actorId) &&
      (!query.action || event.action === query.action) &&
      (!query.origin || event.origin === query.origin) &&
      (!query.status || event.status === query.status)
    )
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

  private parseJson(value: string | null): AuditEvent['beforeData'] {
    if (!value) return undefined
    try {
      return JSON.parse(value) as AuditEvent['beforeData']
    } catch {
      return value
    }
  }

  private toJsonValue(value: unknown): AuditEvent['metadata'] {
    try {
      return JSON.parse(JSON.stringify(value)) as AuditEvent['metadata']
    } catch {
      return undefined
    }
  }
}
