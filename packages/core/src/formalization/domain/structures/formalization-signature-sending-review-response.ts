import type { FormalizationSignatureSendingReview } from './formalization-signature-sending-review'
import type { FormalizationSignatureStatus } from './formalization-signature-status'

export type FormalizationSignatureSendingReviewResponse = Omit<FormalizationSignatureSendingReview, 'status'> & { readonly status: FormalizationSignatureStatus }
