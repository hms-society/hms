type SenderPhoneMatchEvidence = {
  type: 'sender-phone-match'
}

type SenderEmailMatchEvidence = {
  type: 'sender-email-match'
}

type TaxIdMatchEvidence = {
  type: 'tax-id-match'
  taxIdType: 'cpf' | 'cnpj'
  maskedTaxId: string
  matchedFileCount: number
}

type ClientNameMatchEvidence = {
  type: 'client-name-match'
  matchedFileCount: number
}

export type ClientSuggestionEvidence =
  | SenderPhoneMatchEvidence
  | SenderEmailMatchEvidence
  | TaxIdMatchEvidence
  | ClientNameMatchEvidence
