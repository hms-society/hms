type SenderPhoneMatchEvidence = {
  readonly type: 'sender-phone-match'
}

type SenderEmailMatchEvidence = {
  readonly type: 'sender-email-match'
}

type TaxIdMatchEvidence = {
  readonly type: 'tax-id-match'
  readonly taxIdType: 'cpf' | 'cnpj'
  readonly maskedTaxId: string
  readonly matchedFileCount: number
}

type ClientNameMatchEvidence = {
  readonly type: 'client-name-match'
  readonly matchedFileCount: number
}

export type ClientSuggestionEvidence =
  | SenderPhoneMatchEvidence
  | SenderEmailMatchEvidence
  | TaxIdMatchEvidence
  | ClientNameMatchEvidence
