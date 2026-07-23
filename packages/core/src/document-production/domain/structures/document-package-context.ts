type ConsultationDocumentPackageContext = {
  type: 'consultation'
  consultationId: string
}

type FormalizationDocumentPackageContext = {
  type: 'formalization'
  formalizationId: string
}

type CaseDocumentPackageContext = {
  type: 'case'
  caseId: string
}

export type DocumentPackageContext =
  | ConsultationDocumentPackageContext
  | FormalizationDocumentPackageContext
  | CaseDocumentPackageContext
