export const PersonType = {
  Natural: 'natural',
  Legal: 'legal',
} as const

export type PersonType = (typeof PersonType)[keyof typeof PersonType]
