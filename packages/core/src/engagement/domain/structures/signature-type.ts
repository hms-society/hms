export const SignatureType = {
  Physical: 'physical',
  Digital: 'digital',
  Electronic: 'electronic',
} as const

export type SignatureType = (typeof SignatureType)[keyof typeof SignatureType]
