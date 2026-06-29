export const FeasibilityResult = {
  Feasible: 'feasible',
  Infeasible: 'infeasible',
  Pending: 'pending',
} as const

export type FeasibilityResult =
  (typeof FeasibilityResult)[keyof typeof FeasibilityResult]
