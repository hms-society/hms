export type DocumentGenerationSource = {
  readonly type: 'consultation' | 'formalization' | 'case'
  readonly id: string
  readonly data: Readonly<Record<string, unknown>>
}
