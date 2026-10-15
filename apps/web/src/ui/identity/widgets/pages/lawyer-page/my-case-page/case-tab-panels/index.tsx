import type { LegalCaseSummary } from '@hms/core/case-management/domain/entities'
import { TabsContent } from '@/ui/shadcn/tabs'
import { TasksDeadlinesTab } from '../tasks-deadlines-tab'
import { CasePiecesTab } from '../case-pieces-tab'
import { OverviewTab } from '../overview-tab'
import { ChecklistDossierTab } from '../checklist-dossier-tab'
import { CaseTeamRoster } from '@/ui/case-management/widgets/components/case-team-roster'
import { CASE_TASKS, CASE_TIMELINE, MOCK_ACTIVITIES } from '../case-page-data'
import type { ChecklistItem } from '../types'

export type CaseTabPanelsProps = {
  isAdministrator: boolean
  caseUuid: string
  caseDetails?: LegalCaseSummary
  currentCollaboratorId?: string
  checklistItems: ChecklistItem[]
  completionPercentage: number
  mandatoryItemsCount: number
  pendingItemsCount: number
  validatedItemsCount: number
  onOpenChecklist: () => void
  onOpenTasks?: () => void
  openNewPieceDialog: boolean
  onNewPieceDialogOpenChange: (open: boolean) => void
}

export const CaseTabPanels = (props: CaseTabPanelsProps) => (
  <>
    <TabsContent value='visao-geral' className='mt-4 flex flex-col gap-4'>
      <OverviewTab
        caseId={props.caseUuid}
        checklist={props.checklistItems}
        completionPercentage={props.completionPercentage}
        mandatoryItemsCount={props.mandatoryItemsCount}
        pendingItemsCount={props.pendingItemsCount}
        tasks={CASE_TASKS}
        currentCollaboratorId={props.currentCollaboratorId}
        team={
          props.caseDetails?.team?.map((member) => ({
            collaboratorId: member.collaboratorId,
            name: member.name,
            role: member.role,
            initials: member.name.substring(0, 2).toUpperCase(),
            className: 'bg-primary text-primary-foreground',
          })) ?? []
        }
        timeline={CASE_TIMELINE}
        validatedItemsCount={props.validatedItemsCount}
        onOpenChecklist={props.onOpenChecklist}
        onOpenTasks={props.onOpenTasks}
      />
    </TabsContent>
    <TabsContent value='checklist' className='mt-4 flex flex-col gap-4'>
      <ChecklistDossierTab
        activities={MOCK_ACTIVITIES}
        caseId={props.caseUuid}
        checklist={props.checklistItems}
        caseDetails={props.caseDetails}
        readOnly={props.isAdministrator}
      />
    </TabsContent>
    <TabsContent value='prazos' className='mt-4 flex flex-col gap-4'>
      <TasksDeadlinesTab
        caseId={props.caseUuid}
        caseIdentifier={props.caseDetails?.publicCode ?? 'Carregando...'}
        caseTitle={props.caseDetails?.title ?? 'Carregando...'}
        team={props.caseDetails?.team ?? []}
        readOnly={props.isAdministrator}
      />
    </TabsContent>
    <TabsContent value='pecas' className='mt-4 flex flex-col gap-4'>
      <CasePiecesTab
        dossierApproved={Boolean(props.caseDetails?.dossierGate?.homologatedAt)}
        caseId={props.caseUuid}
        openNewPieceDialog={props.openNewPieceDialog}
        onNewPieceDialogOpenChange={props.onNewPieceDialogOpenChange}
        readOnly={props.isAdministrator}
      />
    </TabsContent>
    <TabsContent value='equipe' className='mt-4 flex flex-col gap-4'>
      <CaseTeamRoster caseId={props.caseUuid} />
    </TabsContent>
  </>
)
