import { useState } from 'react'
import { Tabs } from '@/ui/shadcn/tabs'
import { CasePageHeader } from './case-page-header'
import { CaseTabNavigation } from './case-tab-navigation'
import { CaseTabPanels } from './case-tab-panels'
import { MyCasePortalAccess } from './my-case-portal-access'
import { useMyCasePage } from './use-my-case-page'

export type CasoDetalheChecklistPageProps = {
  caseId?: string
  isAdministrator?: boolean
}

export const CasoDetalheChecklistPage = ({
  caseId,
  isAdministrator = false,
}: CasoDetalheChecklistPageProps) => {
  const [isPortalPickerOpen, setIsPortalPickerOpen] = useState(false)
  const [isNewPieceDialogOpen, setIsNewPieceDialogOpen] = useState(false)
  const state = useMyCasePage({ caseId, isAdministrator })

  return (
    <div className='mt-5 flex w-full flex-col gap-5 pb-10 font-sans'>
      <CasePageHeader
        isAdministrator={isAdministrator}
        state={state}
        onOpenPortal={() => setIsPortalPickerOpen(true)}
        onOpenNewPiece={() => {
          state.setActiveTab('pecas')
          setIsNewPieceDialogOpen(true)
        }}
      />
      <Tabs value={state.activeTab} onValueChange={state.setActiveTab} className='w-full'>
        <CaseTabNavigation
          dossierApproved={Boolean(state.caseDetails?.dossierGate?.homologatedAt)}
          readOnly={isAdministrator}
          pendingItemsCount={state.pendingItemsCount}
        />
        <CaseTabPanels
          isAdministrator={isAdministrator}
          caseUuid={state.caseUuid}
          caseDetails={state.caseDetails}
          checklistItems={state.checklistItems}
          completionPercentage={state.completionPercentage}
          mandatoryItemsCount={state.mandatoryItemsCount}
          pendingItemsCount={state.pendingItemsCount}
          validatedItemsCount={state.validatedItemsCount}
          onOpenChecklist={state.handleOpenChecklistTab}
          openNewPieceDialog={isNewPieceDialogOpen}
          onNewPieceDialogOpenChange={setIsNewPieceDialogOpen}
        />
      </Tabs>
      {!isAdministrator && (
        <MyCasePortalAccess
          state={state}
          isPickerOpen={isPortalPickerOpen}
          setIsPickerOpen={setIsPortalPickerOpen}
        />
      )}
    </div>
  )
}
