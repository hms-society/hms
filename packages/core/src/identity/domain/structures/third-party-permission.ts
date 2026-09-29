export const ThirdPartyPermission = {
  ViewIntakeStatus: 'view_intake_status',
  ViewCaseStatus: 'view_case_status',
} as const

export type ThirdPartyPermission =
  (typeof ThirdPartyPermission)[keyof typeof ThirdPartyPermission]
