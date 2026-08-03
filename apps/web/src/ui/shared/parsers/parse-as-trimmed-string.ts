import { createParser } from 'nuqs'

export function parseTrimmedString(value: string) {
  const parsed = value.trim()
  return parsed || null
}

function serializeTrimmedString(value: string) {
  return value.trim()
}

export const parseAsTrimmedString = createParser<string>({
  parse: parseTrimmedString,
  serialize: serializeTrimmedString,
})
