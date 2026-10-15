import { AdministratorCaseHeader } from '../administrator-case-header'
import { LawyerCaseHeader } from '../lawyer-case-header'
import type { useMyCasePage } from '../use-my-case-page'

export type CasePageHeaderProps = {
  isAdministrator: boolean
  isClosureActive: boolean
  state: ReturnType<typeof useMyCasePage>
  onOpenPortal: () => void
  onOpenNewPiece: () => void
}

export const CasePageHeader = ({
  isAdministrator,
  isClosureActive,
  state,
  onOpenPortal,
  onOpenNewPiece,
}: CasePageHeaderProps) =>
  isAdministrator ? (
    <AdministratorCaseHeader
      caseDetails={state.caseDetails}
      isLoading={state.isLoadingCase}
    />
  ) : (
    <LawyerCaseHeader
      title={state.caseTitle}
      publicCode={state.displayCaseId}
      legalArea={state.caseLegalArea}
      clientName={state.caseClientName}
      team={state.caseDetails?.team ?? []}
      isGeneratingPortalLink={state.isGeneratingPortalLink}
      onOpenPortal={onOpenPortal}
      dossierApproved={Boolean(state.caseDetails?.dossierGate?.homologatedAt)}
      caseStatus={state.caseDetails?.status}
      isClosureActive={isClosureActive}
      onOpenNewPiece={onOpenNewPiece}
    />
  )
