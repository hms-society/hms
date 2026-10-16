export const CaseAccessIntent = {
  ReadContent: 'read_content',
  ReadDocument: 'read_document',
  WriteContent: 'write_content',
  ManageChecklistGate: 'manage_checklist_gate',
  ManageTeam: 'manage_team',
  ManageDocumentException: 'manage_document_exception',
} as const

export type CaseAccessIntent = (typeof CaseAccessIntent)[keyof typeof CaseAccessIntent]
