export const CaseClosureBlockerKind = {
  LegalDeadline: 'legal_deadline',
  BlockingTask: 'blocking_task',
  RequiredChecklistItem: 'required_checklist_item',
} as const

export type CaseClosureBlockerKind =
  (typeof CaseClosureBlockerKind)[keyof typeof CaseClosureBlockerKind]

export type CaseClosureBlocker = {
  id: string
  kind: CaseClosureBlockerKind
  title: string
  description?: string
  section: 'deadlines' | 'tasks' | 'checklist'
  href: string
}
