export const DocumentVersionSource = {
  Ai: 'ai',
  Manual: 'manual',
} as const

export type DocumentVersionSource =
  (typeof DocumentVersionSource)[keyof typeof DocumentVersionSource]
