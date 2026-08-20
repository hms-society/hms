import { Inject, Injectable } from '@nestjs/common'
import type {
  IntakeListQuery,
  IntakeListRow,
  IntakeListStatus,
  StatusCounts,
} from '@hms/core/intake/domain/structures'
import { IntakeListStatus as IntakeListStatusValues } from '@hms/core/intake/domain/structures'
import type { IntakeListResponse } from '@hms/core/intake/interfaces'
import { PaginationResponse } from '@hms/core/shared/responses/pagination-response'
import { and, count, desc, eq, gte, inArray, lte, or, sql, type SQL } from 'drizzle-orm'

import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'
import { intakeModel } from '@/intake/database/drizzle/models'

const DEFAULT_PAGE = 1
const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 100
const SAO_PAULO_OFFSET = '-03:00'

const PUBLIC_STATUSES = Object.values(IntakeListStatusValues)

@Injectable()
export class DrizzleIntakeListRepository extends DrizzleRepository {
  constructor(@Inject(DrizzleClient) drizzle: DrizzleClient) {
    super(drizzle)
  }

  async list(query: IntakeListQuery): Promise<IntakeListResponse<IntakeListRow>> {
    const page = this.normalizePage(query.page)
    const pageSize = this.normalizePageSize(query.pageSize)
    const baseWhere = this.buildBaseWhere(query)
    const statusCounts = await this.loadStatusCounts(baseWhere)
    const publicWhere = this.addPublicStatusFilter(baseWhere)
    const where = this.addStatusFilter(publicWhere, query.status)

    const records = await this.database
      .select({
        intakeId: intakeModel.id,
        sequenceNumber: intakeModel.sequenceNumber,
        clientId: intakeModel.clientId,
        responsibleId: intakeModel.responsibleId,
        origin: intakeModel.origin,
        contactChannel: intakeModel.contactChannel,
        demandNotes: intakeModel.demandNotes,
        status: intakeModel.status,
        createdAt: intakeModel.createdAt,
      })
      .from(intakeModel)
      .where(where)
      .orderBy(desc(intakeModel.createdAt), desc(intakeModel.sequenceNumber))
      .limit(pageSize)
      .offset((page - 1) * pageSize)

    const [{ total }] = await this.database
      .select({ total: count() })
      .from(intakeModel)
      .where(where)

    return Object.assign(
      new PaginationResponse(
        records.map((record) => this.toRow(record)),
        page,
        pageSize,
        total,
        Math.ceil(total / pageSize),
      ),
      { statusCounts },
    )
  }

  private buildBaseWhere(query: IntakeListQuery): SQL | undefined {
    const conditions: SQL[] = []
    const search = query.search?.trim()
    const clientIds = query.clientIds

    if (search) {
      const sequenceNumber = this.parseSequenceNumber(search)
      const protocolCondition = sequenceNumber
        ? eq(intakeModel.sequenceNumber, sequenceNumber)
        : undefined
      const clientCondition = clientIds?.length
        ? inArray(intakeModel.clientId, clientIds)
        : clientIds
          ? sql`false`
          : undefined
      const searchCondition = this.combineOr(protocolCondition, clientCondition)

      conditions.push(searchCondition ?? sql`false`)
    } else if (clientIds) {
      conditions.push(
        clientIds.length ? inArray(intakeModel.clientId, clientIds) : sql`false`,
      )
    }

    if (query.responsibleId) {
      conditions.push(eq(intakeModel.responsibleId, query.responsibleId))
    }

    if (query.origin) {
      conditions.push(eq(intakeModel.origin, query.origin))
    }

    if (query.contactChannel) {
      conditions.push(eq(intakeModel.contactChannel, query.contactChannel))
    }

    const registeredFrom = this.parseDateBoundary(query.registeredFrom, 'start')
    const registeredTo = this.parseDateBoundary(query.registeredTo, 'end')
    const hasInvertedDateRange =
      registeredFrom && registeredTo && registeredFrom.getTime() > registeredTo.getTime()

    if (!hasInvertedDateRange) {
      if (registeredFrom) {
        conditions.push(gte(intakeModel.createdAt, registeredFrom))
      }

      if (registeredTo) {
        conditions.push(lte(intakeModel.createdAt, registeredTo))
      }
    }

    return conditions.length ? and(...conditions) : undefined
  }

  private addStatusFilter(
    baseWhere: SQL | undefined,
    status: IntakeListStatus | undefined,
  ): SQL | undefined {
    if (!status) return baseWhere

    const statusCondition = eq(intakeModel.status, status)
    return baseWhere ? and(baseWhere, statusCondition) : statusCondition
  }

  private addPublicStatusFilter(baseWhere: SQL | undefined): SQL {
    const publicStatusCondition = inArray(intakeModel.status, PUBLIC_STATUSES)
    return baseWhere
      ? (and(baseWhere, publicStatusCondition) ?? publicStatusCondition)
      : publicStatusCondition
  }

  private async loadStatusCounts(baseWhere: SQL | undefined): Promise<StatusCounts> {
    const groupedCounts = await this.database
      .select({
        status: intakeModel.status,
        count: count(),
      })
      .from(intakeModel)
      .where(baseWhere)
      .groupBy(intakeModel.status)

    const byStatus = Object.fromEntries(
      PUBLIC_STATUSES.map((status) => [status, 0]),
    ) as Record<IntakeListStatus, number>
    let all = 0
    let registered = 0

    for (const groupedCount of groupedCounts) {
      const amount = groupedCount.count

      if (groupedCount.status === 'registered') {
        registered = amount
        continue
      }

      if (groupedCount.status in byStatus) {
        all += amount
        byStatus[groupedCount.status as IntakeListStatus] = amount
      }
    }

    return {
      all,
      byStatus,
      compatibility: { registered },
    }
  }

  private toRow(record: {
    intakeId: string
    sequenceNumber: number
    clientId: string
    responsibleId: string
    origin: IntakeListRow['origin']
    contactChannel: IntakeListRow['contactChannel']
    demandNotes: string | null
    status: IntakeListRow['status']
    createdAt: Date
  }): IntakeListRow {
    return {
      ...record,
      demandNotes: record.demandNotes ?? undefined,
    }
  }

  private combineOr(first: SQL | undefined, second: SQL | undefined): SQL | undefined {
    if (first && second) return or(first, second)
    return first ?? second
  }

  private parseSequenceNumber(search: string): number | undefined {
    const protocolMatch = /^int-(\d+)$/i.exec(search)
    const numericValue = protocolMatch?.[1] ?? (/^\d+$/.test(search) ? search : undefined)

    if (!numericValue) return undefined

    const sequenceNumber = Number(numericValue)
    return Number.isSafeInteger(sequenceNumber) && sequenceNumber > 0
      ? sequenceNumber
      : undefined
  }

  private parseDateBoundary(
    value: string | undefined,
    boundary: 'start' | 'end',
  ): Date | undefined {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined

    const [year, month, day] = value.split('-').map(Number)
    const calendarDate = new Date(Date.UTC(year, month - 1, day))
    if (
      calendarDate.getUTCFullYear() !== year ||
      calendarDate.getUTCMonth() !== month - 1 ||
      calendarDate.getUTCDate() !== day
    ) {
      return undefined
    }

    const date = new Date(
      `${value}T${boundary === 'start' ? '00:00:00.000' : '23:59:59.999'}${SAO_PAULO_OFFSET}`,
    )
    return Number.isNaN(date.getTime()) ? undefined : date
  }

  private normalizePage(page?: number): number {
    if (!Number.isFinite(page) || !page || page < 1) return DEFAULT_PAGE
    return Math.floor(page)
  }

  private normalizePageSize(pageSize?: number): number {
    if (!Number.isFinite(pageSize) || !pageSize || pageSize < 1) {
      return DEFAULT_PAGE_SIZE
    }

    return Math.min(MAX_PAGE_SIZE, Math.floor(pageSize))
  }
}
