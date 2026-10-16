export const CaseClosureOutcome = {
  Favorable: 'favorable',
  PartiallyFavorable: 'partially_favorable',
  Unfavorable: 'unfavorable',
  Agreement: 'agreement',
  ProductDelivered: 'product_delivered',
  Withdrawal: 'withdrawal',
  Mootness: 'mootness',
  Other: 'other',
} as const

export type CaseClosureOutcome =
  (typeof CaseClosureOutcome)[keyof typeof CaseClosureOutcome]
