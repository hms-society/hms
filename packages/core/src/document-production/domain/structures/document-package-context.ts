type ConsultationDocumentPackageContext = {
  readonly type: 'consultation'
  readonly consultationId: string
}

type FormalizationDocumentPackageContext = {
  readonly type: 'formalization'
  readonly formalizationId: string
}

type LegalProductionDocumentPackageContext = {
  readonly type: 'case'
  readonly caseId: string
}

export type DocumentPackageContext =
  | ConsultationDocumentPackageContext
  | FormalizationDocumentPackageContext
  | LegalProductionDocumentPackageContext
