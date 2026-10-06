import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  HttpStatus,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiQuery, ApiResponse } from '@nestjs/swagger'
import type { AuditEventEntityType } from '@hms/core/shared/domain/structures'
import type { ListAuditLogsQuery } from '@hms/core/shared/interfaces'
import { AuditEventOrigin as AuditOrigins } from '@hms/core/shared/domain/structures'
import {
  GetAuditLogDetailsUseCase,
  ListAuditLogsUseCase,
} from '@hms/core/shared/use-cases'

import { CurrentCollaborator } from '@/identity/decorators'
import { AuthGuard, ActiveCollaboratorGuard } from '@/identity/guards'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import { DrizzleAuditLogsRepository } from '@/shared/database/drizzle/repositories'

type AuditLogsQuery = {
  page?: string
  limit?: string
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
export class ListAuditLogsController {
  private readonly useCase: ListAuditLogsUseCase
  private readonly detailsUseCase: GetAuditLogDetailsUseCase

  constructor(repository: DrizzleAuditLogsRepository) {
    this.useCase = new ListAuditLogsUseCase(repository)
    this.detailsUseCase = new GetAuditLogDetailsUseCase(repository)
  }

  @Get()
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Audit events were returned successfully.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'from', required: false, type: String, format: 'date-time' })
  @ApiQuery({ name: 'to', required: false, type: String, format: 'date-time' })
  @ApiQuery({ name: 'entityType', required: false, type: String })
  @ApiQuery({ name: 'actorId', required: false, type: String, format: 'uuid' })
  @ApiQuery({ name: 'action', required: false, type: String })
  @ApiQuery({ name: 'origin', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  async handle(
    @Query() query: AuditLogsQuery,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    this.ensureAuditAccess(collaborator)

    const parsed = this.parseQuery(query)
    return this.useCase.execute(parsed)
  }

  @Get(':id')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The audit event was returned successfully.',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Audit event not found.' })
  async getDetails(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    this.ensureAuditAccess(collaborator)

    const event = await this.detailsUseCase.execute({ id })
    if (!event) {
      throw new NotFoundException('Audit event not found.')
    }

    return event
  }

  private ensureAuditAccess(collaborator: CollaboratorSummary) {
    if (collaborator.profile !== 'admin' && collaborator.profile !== 'supervisor') {
      throw new ForbiddenException(
        'Only administrators and compliance supervisors can view audit logs.',
      )
    }
  }

  private parseQuery(query: AuditLogsQuery): ListAuditLogsQuery {
    const page = this.parsePositiveInteger(query.page, 1, 'page')
    const limit = Math.min(this.parsePositiveInteger(query.limit, 20, 'limit'), 100)
    const from = this.parseDate(query.from, 'from')
    const to = this.parseDate(query.to, 'to')

    if (from && to && from > to) {
      throw new BadRequestException('The from date must be before the to date.')
    }

    return {
      page,
      limit,
      from,
      to,
      actorId: query.actorId,
      action: query.action,
      entityType: this.parseEnum(query.entityType, entityTypes, 'entityType'),
      origin: this.parseEnum(query.origin, Object.values(AuditOrigins), 'origin'),
      status: this.parseEnum(query.status, ['success', 'failure'], 'status'),
    }
  }

  private parsePositiveInteger(
    value: string | undefined,
    fallback: number,
    name: string,
  ) {
    if (value === undefined) return fallback
    const parsed = Number(value)
    if (!Number.isInteger(parsed) || parsed < 1) {
      throw new BadRequestException(`${name} must be a positive integer.`)
    }
    return parsed
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
