import type { FormalizationSignatureSendingIssueCode } from './formalization-signature-sending-issue-code'

export type FormalizationSignatureSendingIssue = {
  readonly code: FormalizationSignatureSendingIssueCode
  readonly documentId?: string
  readonly signatoryId?: string
}
