import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  HttpStatus,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiQuery, ApiResponse } from '@nestjs/swagger'
import type { AuditEventEntityType } from '@hms/core/shared/domain/structures'
import { AuditEventOrigin as AuditOrigins } from '@hms/core/shared/domain/structures'
import type { ListAuditLogsQuery } from '@hms/core/shared/interfaces'
import { ExportAuditLogsUseCase } from '@hms/core/shared/use-cases'
import type { Response } from 'express'

import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import { CurrentCollaborator } from '@/identity/decorators'
import { AuthGuard, ActiveCollaboratorGuard } from '@/identity/guards'
import { DrizzleAuditLogsRepository } from '@/shared/database/drizzle/repositories'

type ExportAuditLogsQuery = {
  format?: string
  from?: string
  to?: string
  entityType?: string
  actorId?: string
  action?: string
  origin?: string
  status?: string
}

const entityTypes: readonly AuditEventEntityType[] = [
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

@Controller('audit-logs')
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class ExportAuditLogsController {
  private readonly useCase: ExportAuditLogsUseCase

  constructor(repository: DrizzleAuditLogsRepository) {
    this.useCase = new ExportAuditLogsUseCase(repository, repository)
  }

  @Get('export')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The audit events were exported successfully.',
  })
  @ApiQuery({ name: 'format', required: false, enum: ['csv', 'json'] })
  async handle(
    @Query() query: ExportAuditLogsQuery,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
    @Res() response: Response,
  ) {
    this.ensureAuditAccess(collaborator)
    const format = this.parseEnum(query.format, ['csv', 'json'], 'format') ?? 'csv'
    const result = await this.useCase.execute({
      query: this.parseQuery(query),
      format,
      actorId: collaborator.collaboratorId,
      actorProfile: collaborator.profile,
    })

    return response
      .status(HttpStatus.OK)
      .type(result.contentType)
      .attachment(result.fileName)
      .send(result.content)
  }

  private ensureAuditAccess(collaborator: CollaboratorSummary) {
    if (collaborator.profile !== 'admin' && collaborator.profile !== 'supervisor') {
      throw new ForbiddenException(
        'Only administrators and compliance supervisors can export audit logs.',
      )
    }
  }

  private parseQuery(
    query: ExportAuditLogsQuery,
  ): Omit<ListAuditLogsQuery, 'page' | 'limit'> {
    const from = this.parseDate(query.from, 'from')
    const to = this.parseDate(query.to, 'to')
    if (from && to && from > to) {
      throw new BadRequestException('The from date must be before the to date.')
    }

    return {
      from,
      to,
      actorId: query.actorId,
      action: query.action,
      entityType: this.parseEnum(query.entityType, entityTypes, 'entityType'),
      origin: this.parseEnum(query.origin, Object.values(AuditOrigins), 'origin'),
      status: this.parseEnum(query.status, ['success', 'failure'], 'status'),
    }
  }

  private parseDate(value: string | undefined, name: string) {
    if (!value) return undefined
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException(`${name} must be a valid date.`)
    }
    return parsed
  }

  private parseEnum<T extends string>(
    value: string | undefined,
    values: readonly T[],
    name: string,
  ) {
    if (!value) return undefined
    if (!values.includes(value as T)) {
      throw new BadRequestException(`${name} has an invalid value.`)
    }
    return value as T
  }
}
