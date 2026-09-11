import type { FormalizationSignatureResult } from './formalization-signature-result'

export type FormalizationSignatureGatewayResultResponse = Omit<
  FormalizationSignatureResult,
  'occurredAt' | 'confirmedAt'
> & { readonly occurredAt?: string; readonly confirmedAt?: string }
