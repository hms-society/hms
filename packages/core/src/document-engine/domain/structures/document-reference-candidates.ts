import type { DocumentReferenceCaseCandidate } from './document-reference-case-candidate'
import type { DocumentReferenceChecklistItemCandidate } from './document-reference-checklist-item-candidate'

export type DocumentReferenceCandidates = {
  cases: DocumentReferenceCaseCandidate[]
  checklistItems: DocumentReferenceChecklistItemCandidate[]
}
