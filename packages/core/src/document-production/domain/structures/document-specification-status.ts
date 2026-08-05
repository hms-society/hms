export const DocumentSpecificationStatus = {
  Available: 'available',
  Unavailable: 'unavailable',
} as const

export type DocumentSpecificationStatus =
  (typeof DocumentSpecificationStatus)[keyof typeof DocumentSpecificationStatus]
