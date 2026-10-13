import type { ChecklistDossierTabProps } from '../types'
import { ChecklistDossierView } from '../checklist-dossier-view'
import { useChecklistDossierTabContent } from './use-checklist-dossier-tab-content'

export type ChecklistDossierTabContentProps = ChecklistDossierTabProps

export const ChecklistDossierTabContent = (props: ChecklistDossierTabContentProps) => {
  const controller = useChecklistDossierTabContent(props)

  return (
    <ChecklistDossierView
      activities={
        controller.state.activities.length > 0
          ? controller.state.activities
          : (props.activities ?? [])
      }
      controller={controller}
      readOnly={Boolean(props.readOnly)}
      reviewDisabledReason={props.reviewDisabledReason}
    />
  )
}
