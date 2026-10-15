import type {
  DocumentValidationDocument,
  DocumentValidationChecklistLink,
  DocumentValidationDuplicateMatch,
} from './document-validation'

export type DocumentValidationRecord = Omit<
  DocumentValidationDocument,
  'reviewedByName' | 'checklistLink' | 'duplicateMatch'
> & {
  checklistLink?: Pick<DocumentValidationChecklistLink, 'caseId' | 'checklistItemId'> &
    Partial<Pick<DocumentValidationChecklistLink, 'caseLabel' | 'checklistItemLabel'>>
  duplicateMatch?: Omit<
    DocumentValidationDuplicateMatch,
    'caseLabel' | 'checklistItemLabel'
  > &
    Partial<Pick<DocumentValidationDuplicateMatch, 'caseLabel' | 'checklistItemLabel'>>
}
