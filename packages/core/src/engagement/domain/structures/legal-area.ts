export const LegalArea = {
  Previdenciario: 'previdenciario',
  Trabalhista: 'trabalhista',
  Sindical: 'sindical',
} as const

export type LegalArea = (typeof LegalArea)[keyof typeof LegalArea]
