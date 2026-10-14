export const CaseAccessIntent = {
  ReadContent: 'read_content',
  WriteContent: 'write_content',
  ManageTeam: 'manage_team',
  ManageDocumentException: 'manage_document_exception',
} as const

export type CaseAccessIntent = (typeof CaseAccessIntent)[keyof typeof CaseAccessIntent]
