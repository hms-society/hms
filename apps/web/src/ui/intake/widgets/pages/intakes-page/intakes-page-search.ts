import { IntakeListStatus } from '@hms/core/intake/domain/structures'

import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  type inferParserType,
} from 'nuqs'

const statusValues = Object.values(IntakeListStatus) as [
  Exclude<IntakeListStatus, 'registered'>,
  ...Exclude<IntakeListStatus, 'registered'>[],
]

export const INTAKE_SEARCH_PARAMS = {
  search: parseAsString.withDefault(''),
  status: parseAsStringLiteral(statusValues),
  responsibleId: parseAsString,
  origin: parseAsString,
  contactChannel: parseAsString,
  registeredFrom: parseAsString,
  registeredTo: parseAsString,
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(20),
}

export type IntakeSearchParams = inferParserType<typeof INTAKE_SEARCH_PARAMS>

export function parseIntakeListSearch(search: Record<string, unknown>) {
  return {
    search: typeof search.search === 'string' ? search.search.trim() : '',
    status: parseStatus(search.status),
    responsibleId: parseOptionalString(search.responsibleId),
    origin: parseOptionalString(search.origin),
    contactChannel: parseOptionalString(search.contactChannel),
    registeredFrom: parseDate(search.registeredFrom),
    registeredTo: parseDate(search.registeredTo),
    page: parsePositive(search.page, 1),
    pageSize: parsePageSize(search.pageSize),
  }
}

function parseStatus(value: unknown) {
  return typeof value === 'string' && statusValues.includes(value as never)
    ? (value as (typeof statusValues)[number])
    : undefined
}

function parseOptionalString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function parseDate(value: unknown) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? value
    : undefined
}

function parsePositive(value: unknown, fallback: number) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

function parsePageSize(value: unknown) {
  const parsed = parsePositive(value, 20)
  return parsed <= 100 ? parsed : 20
}
