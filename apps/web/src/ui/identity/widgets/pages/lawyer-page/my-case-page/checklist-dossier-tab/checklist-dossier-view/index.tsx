import type { ActivityItem } from '../../types'
import type { ChecklistDossierController } from '../types'
import { ChecklistGate } from '../checklist-gate'
import { ChecklistSection } from '../checklist-section'
import { DossierSection } from '../dossier-section'
import { Button } from '@/ui/shadcn/button'
import { ExceptionManagement } from '../exception-management'
import { ActivitySection } from '../activity-section'

export type ChecklistDossierViewProps = {
  activities: ActivityItem[]
  controller: ChecklistDossierController
  readOnly: boolean
  reviewDisabledReason?: string
}

export const ChecklistDossierView = (props: ChecklistDossierViewProps) => (
  <>
    <ChecklistGate
      disabledReason={props.reviewDisabledReason}
      readOnly={props.readOnly}
      state={props.controller.state}
    />
    <ChecklistSection readOnly={props.readOnly} state={props.controller.state} />
    <DossierSection
      pendingItemsCount={
        props.controller.hasAuthorizedException
          ? 0
          : props.controller.state.pendingItemsCount
      }
    />
    {!props.readOnly && (
      <Button
        variant='outline'
        size='xs'
        className='w-fit rounded-full'
        disabled={
          !props.controller.state.canHomologateDossier ||
          props.controller.state.isHomologatingDossier
        }
        onClick={props.controller.state.handleHomologateDossier}
      >
        Homologar dossiê
      </Button>
    )}

    <ExceptionManagement controller={props.controller} readOnly={props.readOnly} />
    <ActivitySection activities={props.activities} />
  </>
)
