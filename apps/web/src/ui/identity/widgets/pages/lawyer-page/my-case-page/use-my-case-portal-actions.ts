import { useMutation } from '@tanstack/react-query'
import type { CaseManagementService } from '@hms/core/case-management/interfaces'
import type { useMyCasePortalState } from './use-my-case-portal-state'
import { toast } from 'sonner'

type PortalState = ReturnType<typeof useMyCasePortalState>

export function useMyCasePortalActions(params: {
  caseId: string
  caseManagementService: CaseManagementService
  state: PortalState
  refetchAccess: () => Promise<unknown>
}) {
  const mutation = useMutation({
    mutationFn: () =>
      grantPortalAccess(params.caseManagementService, params.caseId, params.state),
    onSuccess: (access) => {
      params.state.setPortalAccessUrl(
        new URL(access.portalAccessUrl, window.location.origin).toString(),
      )
      params.state.setPortalAccessExpiresAt(access.expiresAt)
      void params.refetchAccess()
    },
  })

  function handleGeneratePortalLink() {
    if (!params.state.selectedThirdPartyId) return
    return mutation.mutateAsync()
  }

  async function handleCopyPortalLink() {
    if (!params.state.portalAccessUrl) return
    try {
      await navigator.clipboard.writeText(params.state.portalAccessUrl)
      toast.success('Link do portal copiado.')
    } catch {
      toast.error('Não foi possível copiar o link.')
    }
  }

  return {
    isGeneratingPortalLink: mutation.isPending,
    handleGeneratePortalLink,
    handleCopyPortalLink,
  }
}

async function grantPortalAccess(
  service: CaseManagementService,
  caseId: string,
  state: PortalState,
) {
  const response = await service.grantCasePortalAccess(caseId, {
    canUpload: state.canUpload,
    canViewCaseStatus: state.canViewCaseStatus,
    canViewIntakeStatus: state.canViewIntakeStatus,
    thirdPartyId: state.selectedThirdPartyId,
  })
  if (response.isFailure) response.throwError()
  return response.body
}
