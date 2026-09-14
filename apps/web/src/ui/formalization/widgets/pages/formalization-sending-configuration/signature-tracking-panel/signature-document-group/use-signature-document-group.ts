import type {
  FormalizationSignatureTrackingDocument,
  FormalizationSignatureTrackingSignatory,
} from '@hms/core/formalization/domain/structures'

export type SignatureDocumentGroupProps = {
  document: FormalizationSignatureTrackingDocument
  isResending: boolean
  onRequestResend: (signatory: FormalizationSignatureTrackingSignatory) => void
}

export function useSignatureDocumentGroup({ document }: SignatureDocumentGroupProps) {
  return {
    signatories: [...document.signatories].sort((first, second) =>
      first.recipientId.localeCompare(second.recipientId),
    ),
  }
}
