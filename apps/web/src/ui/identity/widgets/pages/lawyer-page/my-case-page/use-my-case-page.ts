import { useState } from 'react'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { useCaseTeamQuery } from '@/ui/case-management/hooks/use-case-team-query'
import { useMyCasePageAccess } from './use-my-case-page-access'
import { useMyCasePageLegalData } from './use-my-case-page-legal-data'
import { useMyCasePortalState } from './use-my-case-portal-state'
import { useMyCasePortalData } from './use-my-case-portal-data'
import { useMyCasePortalActions } from './use-my-case-portal-actions'

export type UseMyCasePageParams = {
  caseId?: string
  isAdministrator?: boolean
}

export function useMyCasePage({ caseId, isAdministrator = false }: UseMyCasePageParams) {
  const { caseManagementService, identityService } = useRestContext()
  const access = useMyCasePageAccess(isAdministrator)
  const caseUuid = caseId ?? '00000000-0000-4000-8000-000000000089'
  const caseTeamQuery = useCaseTeamQuery(caseUuid)
  const portalState = useMyCasePortalState()
  const portalData = useMyCasePortalData({
    caseId: caseUuid,
    collaboratorId: access.currentCollaborator?.collaboratorId,
    enabled: access.canLoadLegalContent && !isAdministrator,
    identityService,
    caseManagementService,
    state: portalState,
  })
  const portalActions = useMyCasePortalActions({
    caseId: caseUuid,
    caseManagementService,
    state: portalState,
    refetchAccess: portalData.refetchAccess,
  })
  const legalData = useMyCasePageLegalData({
    caseId: caseUuid,
    collaboratorId: access.currentCollaborator?.collaboratorId,
    enabled: access.canLoadLegalContent && Boolean(caseId),
    isAdministrator,
    caseManagementService,
  })
  const [activeTab, setActiveTab] = useState('visao-geral')

  return {
    ...portalState,
    ...portalActions,
    ...legalData,
    activeTab,
    caseUuid,
    caseTeam: caseTeamQuery.caseTeam,
    caseTeamError: caseTeamQuery.caseTeamError,
    isLoadingCaseTeam: caseTeamQuery.isLoadingCaseTeam,
    canLoadLegalContent: access.canLoadLegalContent,
    displayCaseId: legalData.caseDetails?.publicCode ?? 'Carregando...',
    thirdParties: portalData.thirdParties,
    setActiveTab,
    handleOpenChecklistTab: () => setActiveTab('checklist'),
    handleClosePortalAccessDialog: portalState.closePortalAccessDialog,
  }
}
