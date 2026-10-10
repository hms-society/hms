import { CaseMemberRole } from '@hms/core/case-management/domain/structures'
import type { CaseEligibleCollaborator } from '@hms/core/case-management/domain/structures'
import { CollaboratorProfile } from '@hms/core/identity/domain/structures'
import { useEffect, useState } from 'react'

import { useCaseTeamCandidatesQuery } from '@/ui/case-management/hooks/use-case-team-candidates-query'

import type { CaseTeamMemberSelectorProps } from './types/case-team-member-selector-props'

type SelectorState = {
  search: string
  profile: CollaboratorProfile | 'all'
  page: number
  selectedCollaborator: CaseEligibleCollaborator | null
  role: CaseMemberRole
  setSearch: (value: string) => void
  setProfile: (value: CollaboratorProfile | 'all') => void
  setPage: (value: number | ((current: number) => number)) => void
  setSelectedCollaborator: (value: CaseEligibleCollaborator | null) => void
  setRole: (value: CaseMemberRole) => void
}

function useSelectorState(props: CaseTeamMemberSelectorProps): SelectorState {
  const { initialRole = CaseMemberRole.Collaborator, open, requiredProfile } = props
  const [search, setSearch] = useState('')
  const [profile, setProfile] = useState<CollaboratorProfile | 'all'>(
    requiredProfile ?? 'all',
  )
  const [page, setPage] = useState(1)
  const [selectedCollaborator, setSelectedCollaborator] =
    useState<CaseEligibleCollaborator | null>(null)
  const [role, setRole] = useState<CaseMemberRole>(initialRole)

  useEffect(() => {
    if (!open) return
    setSearch('')
    setProfile(requiredProfile ?? 'all')
    setPage(1)
    setSelectedCollaborator(null)
    setRole(initialRole)
  }, [initialRole, open, requiredProfile])

  return {
    search,
    profile,
    page,
    selectedCollaborator,
    role,
    setSearch,
    setProfile,
    setPage,
    setSelectedCollaborator,
    setRole,
  }
}

function createSelectorHandlers(
  state: SelectorState,
  props: CaseTeamMemberSelectorProps,
  totalPages: number,
) {
  const allowedRoles = props.allowedRoles ?? [
    CaseMemberRole.Collaborator,
    CaseMemberRole.Manager,
  ]
  const requiredProfile = props.requiredProfile

  function handleSearchChange(value: string) {
    state.setSearch(value)
    state.setPage(1)
    state.setSelectedCollaborator(null)
  }

  function handleProfileChange(value: string) {
    state.setProfile(value as CollaboratorProfile | 'all')
    state.setPage(1)
    state.setSelectedCollaborator(null)
  }

  function handleRoleChange(value: string) {
    if (allowedRoles.includes(value as CaseMemberRole))
      state.setRole(value as CaseMemberRole)
  }

  function handleConfirmSelection() {
    if (!state.selectedCollaborator) return
    props.onSelect(state.selectedCollaborator, state.role)
    props.onClose()
  }

  function handleClearFilters() {
    state.setSearch('')
    state.setProfile(requiredProfile ?? 'all')
    state.setPage(1)
    state.setSelectedCollaborator(null)
  }

  return {
    allowedRoles,
    isSingleRole: allowedRoles.length === 1,
    handleSearchChange,
    handleProfileChange,
    handleRoleChange,
    handleConfirmSelection,
    handleClearFilters,
    handlePreviousPage: () => {
      state.setPage((currentPage) => Math.max(1, currentPage - 1))
      state.setSelectedCollaborator(null)
    },
    handleNextPage: () => {
      state.setPage((currentPage) => Math.min(totalPages, currentPage + 1))
      state.setSelectedCollaborator(null)
    },
  }
}

function getProfileLabel(profileValue: CollaboratorProfile) {
  if (profileValue === CollaboratorProfile.Lawyer) return 'Advogado'
  if (profileValue === CollaboratorProfile.Paralegal) return 'Paralegal'
  if (profileValue === CollaboratorProfile.Supervisor) return 'Supervisor'
  return profileValue
}

export function useCaseTeamMemberSelector(props: CaseTeamMemberSelectorProps) {
  const state = useSelectorState(props)
  const allowedRoles = props.allowedRoles ?? [
    CaseMemberRole.Collaborator,
    CaseMemberRole.Manager,
  ]
  const query = useCaseTeamCandidatesQuery({
    caseId: props.caseId,
    enabled: props.open,
    page: state.page,
    pageSize: 20,
    profile:
      props.requiredProfile ?? (state.profile === 'all' ? undefined : state.profile),
    search: state.search,
  })
  const handlers = createSelectorHandlers(
    state,
    { ...props, allowedRoles },
    query.caseTeamCandidates?.totalPages ?? state.page,
  )

  return {
    caseTeamCandidates: query.caseTeamCandidates,
    caseTeamCandidatesError: query.caseTeamCandidatesError,
    getProfileLabel,
    ...handlers,
    handleCollaboratorSelect: state.setSelectedCollaborator,
    isLoadingCaseTeamCandidates: query.isLoadingCaseTeamCandidates,
    page: state.page,
    profile: state.profile,
    refetchCaseTeamCandidates: query.refetchCaseTeamCandidates,
    requiredProfile: props.requiredProfile,
    role: state.role,
    search: state.search,
    selectedCollaborator: state.selectedCollaborator,
  }
}
