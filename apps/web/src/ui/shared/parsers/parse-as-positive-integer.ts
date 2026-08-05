import { createParser } from 'nuqs'

export function parsePositiveInteger(value: string) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

export const parseAsPositiveInteger = createParser<number>({
  parse: parsePositiveInteger,
  serialize: (value) => String(value),
})
