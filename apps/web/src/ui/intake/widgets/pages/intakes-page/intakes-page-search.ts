import {
  ContactChannel,
  IntakeListStatus,
  IntakeOrigin,
} from '@hms/core/intake/domain/structures'
import { parseAsStringLiteral, type inferParserType } from 'nuqs'

import {
  parseAsDateOnly,
  parseAsPositiveInteger,
  parseAsTrimmedString,
  parseDateOnly,
  parseTrimmedString,
} from '@/ui/shared/parsers'

export const INTAKE_SEARCH_PARAMS = {
  search: parseAsTrimmedString,
  status: parseAsStringLiteral([
    IntakeListStatus.ConsultationScheduled,
    IntakeListStatus.ConsultationCompleted,
    IntakeListStatus.ViabilityRegistered,
    IntakeListStatus.InFormalization,
    IntakeListStatus.Contracted,
    IntakeListStatus.ClosedWithoutContract,
  ] as const),
  responsibleId: parseAsTrimmedString,
  origin: parseAsStringLiteral(
    Object.values(IntakeOrigin) as [IntakeOrigin, ...IntakeOrigin[]],
  ),
  contactChannel: parseAsStringLiteral(
    Object.values(ContactChannel) as [ContactChannel, ...ContactChannel[]],
  ),
  registeredFrom: parseAsDateOnly,
  registeredTo: parseAsDateOnly,
  page: parseAsPositiveInteger.withDefault(1),
  pageSize: parseAsPositiveInteger.withDefault(20),
}

export type IntakeSearchParams = inferParserType<typeof INTAKE_SEARCH_PARAMS>

export function parseIntakeSearch(search: Record<string, unknown>): IntakeSearchParams {
  return {
    search: typeof search.search === 'string' ? parseTrimmedString(search.search) : null,
    status:
      typeof search.status === 'string' &&
      Object.values(IntakeListStatus).includes(search.status as never) &&
      search.status !== 'registered'
        ? (search.status as IntakeSearchParams['status'])
        : null,
    responsibleId:
      typeof search.responsibleId === 'string'
        ? parseTrimmedString(search.responsibleId)
        : null,
    origin:
      typeof search.origin === 'string' &&
      Object.values(IntakeOrigin).includes(search.origin as never)
        ? (search.origin as IntakeSearchParams['origin'])
        : null,
    contactChannel:
      typeof search.contactChannel === 'string' &&
      Object.values(ContactChannel).includes(search.contactChannel as never)
        ? (search.contactChannel as IntakeSearchParams['contactChannel'])
        : null,
    registeredFrom:
      typeof search.registeredFrom === 'string'
        ? parseDateOnly(search.registeredFrom)
        : null,
    registeredTo:
      typeof search.registeredTo === 'string' ? parseDateOnly(search.registeredTo) : null,
    page: parseSearchPage(search.page, 1),
    pageSize: parseSearchPageSize(search.pageSize),
  }
}

function parseSearchPage(value: unknown, fallback: number) {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) return value
  if (typeof value !== 'string' || !/^\d+$/.test(value)) return fallback

  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

function parseSearchPageSize(value: unknown) {
  const parsed = parseSearchPage(value, 20)
  return parsed >= 1 && parsed <= 100 ? parsed : 20
}
