import type { FormalizationSignatureReadinessIssueCode } from './formalization-signature-readiness-issue'

type FormalizationSignatureReadinessIssue = {
  readonly path: string
  readonly code: FormalizationSignatureReadinessIssueCode
}

export type FormalizationSignatureReadiness = {
  readonly ready: boolean
  readonly assignmentCount: number
  readonly issues: ReadonlyArray<FormalizationSignatureReadinessIssue>
}
