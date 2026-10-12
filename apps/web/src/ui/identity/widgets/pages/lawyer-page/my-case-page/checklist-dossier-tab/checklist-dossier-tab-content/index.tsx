import type { ChecklistDossierTabProps } from '../types'
import { ChecklistDossierView } from '../checklist-dossier-view'
import { useChecklistDossierTabContent } from './use-checklist-dossier-tab-content'

export type ChecklistDossierTabContentProps = ChecklistDossierTabProps

export const ChecklistDossierTabContent = (props: ChecklistDossierTabContentProps) => (
  <ChecklistDossierView
    activities={props.activities}
    controller={useChecklistDossierTabContent(props)}
    readOnly={Boolean(props.readOnly)}
    reviewDisabledReason={props.reviewDisabledReason}
  />
)
