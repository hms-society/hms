import type { ContractualDocument, SignatureType } from '../structures'

export type Formalization = {
  id: string
  intakeId: string
  signatureType: SignatureType
  contractDocuments: ContractualDocument[]
  startedAt: Date
  formalizedAt?: Date
}
