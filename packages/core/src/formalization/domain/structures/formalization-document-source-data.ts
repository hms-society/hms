import type { Consultation } from '../../../consultation/domain/entities'
import type {
  Collaborator,
  LegalClient,
  NaturalClient,
} from '../../../identity/domain/entities'
import type {
  DynamicFormAnswer,
  DynamicFormSnapshot,
} from '../../../shared/domain/structures'

type ImmutableSnapshot<Value> = Value extends Date
  ? string
  : Value extends readonly (infer Item)[]
    ? readonly ImmutableSnapshot<Item>[]
    : Value extends object
      ? { readonly [Key in keyof Value]: ImmutableSnapshot<Value[Key]> }
      : Value

type FormalizationDocumentSourceDataBase = {
  formalization: {
    id: string
    contractFormRevision: number
    contractFormSnapshot: DynamicFormSnapshot
    contractFormAnswers: DynamicFormAnswer[]
  }
  intake: {
    id: string
    sequenceNumber: number
    legalAreaId?: string
    legalTopicId?: string
    demandNotes?: string
  }
  consultation: {
    id: string
    primaryLegalQuestion: string
    guidanceProvided: string
    relevantFacts: Consultation['relevantFacts']
    potentialLegalRequests: Consultation['potentialLegalRequests']
    identifiedRisks: Consultation['identifiedRisks']
    suggestions: Consultation['suggestions']
    dynamicFormSnapshot?: DynamicFormSnapshot
    dynamicFormAnswers?: DynamicFormAnswer[]
  }
  client:
    | Pick<
        NaturalClient,
        'id' | 'type' | 'name' | 'taxId' | 'email' | 'phone' | 'address'
      >
    | Pick<
        LegalClient,
        | 'id'
        | 'type'
        | 'legalName'
        | 'tradeName'
        | 'taxId'
        | 'email'
        | 'phone'
        | 'address'
      >
  assignedLawyer: Pick<
    Collaborator,
    'id' | 'professionalName' | 'jobTitle' | 'profile' | 'legalExpertises'
  >
}

export type FormalizationDocumentSourceData =
  ImmutableSnapshot<FormalizationDocumentSourceDataBase>
