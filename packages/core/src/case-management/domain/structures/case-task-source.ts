export const CaseTaskSource = {
  Manual: 'manual',
  Automation: 'automation',
  Import: 'import',
} as const

export type CaseTaskSource = (typeof CaseTaskSource)[keyof typeof CaseTaskSource]
