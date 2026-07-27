export const ClientType = {
  Natural: 'natural',
  Legal: 'legal',
} as const

export type ClientType = (typeof ClientType)[keyof typeof ClientType]
