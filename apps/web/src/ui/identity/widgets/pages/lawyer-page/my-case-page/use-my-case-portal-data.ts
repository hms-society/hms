import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { IdentityService } from '@hms/core/identity/interfaces'
import type { CaseManagementService } from '@hms/core/case-management/interfaces'
import type { useMyCasePortalState } from './use-my-case-portal-state'

type PortalState = ReturnType<typeof useMyCasePortalState>

export function useMyCasePortalData(params: {
  caseId: string
  collaboratorId?: string
  enabled: boolean
  identityService: IdentityService
  caseManagementService: CaseManagementService
  state: PortalState
}) {
  const thirdPartiesQuery = useQuery({
    queryKey: ['third-parties', 'active', params.collaboratorId],
    queryFn: async () => {
      const response = await params.identityService.listThirdParties()
      if (response.isFailure) response.throwError()
      return response.body.filter((party) => party.status === 'active')
    },
    enabled: params.enabled,
  })
  const accessQuery = useQuery({
    queryKey: ['case-portal-access', params.caseId, params.collaboratorId],
    queryFn: async () => {
      const response = await params.caseManagementService.listCasePortalAccess(
        params.caseId,
      )
      if (response.isFailure) response.throwError()
      return response.body
    },
    enabled: params.enabled,
  })

  useEffect(() => {
    restorePortalSelection({
      selectedId: params.state.selectedThirdPartyId,
      thirdParties: thirdPartiesQuery.data ?? [],
      access: accessQuery.data ?? [],
      setSelectedId: params.state.setSelectedThirdPartyId,
      setCanViewCaseStatus: params.state.setCanViewCaseStatus,
      setCanViewIntakeStatus: params.state.setCanViewIntakeStatus,
      setCanUpload: params.state.setCanUpload,
    })
  }, [
    accessQuery.data,
    params.state.selectedThirdPartyId,
    params.state.setSelectedThirdPartyId,
    params.state.setCanViewCaseStatus,
    params.state.setCanViewIntakeStatus,
    params.state.setCanUpload,
    thirdPartiesQuery.data,
  ])

  return {
    thirdParties: thirdPartiesQuery.data ?? [],
    refetchAccess: accessQuery.refetch,
  }
}

function restorePortalSelection(params: {
  selectedId: string
  thirdParties: readonly { id: string }[]
  access: readonly {
    thirdPartyId?: string | null
    canViewCaseStatus: boolean
    canViewIntakeStatus: boolean
    canUpload: boolean
  }[]
  setSelectedId: (id: string) => void
  setCanViewCaseStatus: (value: boolean) => void
  setCanViewIntakeStatus: (value: boolean) => void
  setCanUpload: (value: boolean) => void
}) {
  if (params.selectedId || !params.access.length) return
  const activeIds = new Set(params.thirdParties.map((party) => party.id))
  const previous = params.access.find(
    (item) => item.thirdPartyId && activeIds.has(item.thirdPartyId),
  )
  if (!previous?.thirdPartyId) return
  params.setSelectedId(previous.thirdPartyId)
  params.setCanViewCaseStatus(previous.canViewCaseStatus)
  params.setCanViewIntakeStatus(previous.canViewIntakeStatus)
  params.setCanUpload(previous.canUpload)
}
