import {
  ContactChannel,
  IntakeListStatus,
  IntakeOrigin,
} from '@hms/core/intake/domain/structures'
import { createParser, parseAsStringLiteral, type inferParserType } from 'nuqs'

const statusValues = Object.values(IntakeListStatus) as [
  Exclude<IntakeListStatus, 'registered'>,
  ...Exclude<IntakeListStatus, 'registered'>[],
]
const originValues = Object.values(IntakeOrigin) as [IntakeOrigin, ...IntakeOrigin[]]
const contactChannelValues = Object.values(ContactChannel) as [
  ContactChannel,
  ...ContactChannel[],
]

const searchParser = createParser<string>({
  parse(value) {
    return value.trim()
  },
  serialize(value) {
    return value.trim()
  },
}).withDefault('')

const optionalTrimmedStringParser = createParser<string>({
  parse(value) {
    return value.trim() || null
  },
  serialize(value) {
    return value.trim()
  },
})

const dateParser = createParser<string>({
  parse(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null

    const parsedDate = new Date(`${value}T00:00:00.000Z`)
    return Number.isNaN(parsedDate.getTime()) ||
      parsedDate.toISOString().slice(0, 10) !== value
      ? null
      : value
  },
  serialize(value) {
    return value
  },
})

const positiveIntegerParser = createParser<number>({
  parse(value) {
    const parsedValue = Number(value)
    return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : null
  },
  serialize(value) {
    return String(value)
  },
})

const pageSizeParser = createParser<number>({
  parse(value) {
    const parsedValue = Number(value)
    return Number.isInteger(parsedValue) && parsedValue > 0 && parsedValue <= 100
      ? parsedValue
      : null
  },
  serialize(value) {
    return String(value)
  },
})

function createTrimmedLiteralParser<const Literal extends string>(
  validValues: readonly Literal[],
) {
  const literalParser = parseAsStringLiteral(validValues)

  return createParser<Literal>({
    parse(value) {
      return literalParser.parse(value.trim())
    },
    serialize(value) {
      return literalParser.serialize(value)
    },
  })
}

export const INTAKE_SEARCH_PARAMS = {
  search: searchParser,
  status: parseAsStringLiteral(statusValues),
  responsibleId: optionalTrimmedStringParser,
  origin: createTrimmedLiteralParser(originValues),
  contactChannel: createTrimmedLiteralParser(contactChannelValues),
  registeredFrom: dateParser,
  registeredTo: dateParser,
  page: positiveIntegerParser.withDefault(1),
  pageSize: pageSizeParser.withDefault(20),
}

export type IntakeSearchParams = inferParserType<typeof INTAKE_SEARCH_PARAMS>
