import type { ChecklistDossierTabProps } from './types'
import { ChecklistDossierTabContent } from './checklist-dossier-tab-content'

export const ChecklistDossierTab = (props: ChecklistDossierTabProps) => {
  return <ChecklistDossierTabContent {...props} />
}
export type { ChecklistDossierTabProps } from './types'
