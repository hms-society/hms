import { createElement, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { CollaboratorProfile, UserStatus } from '@hms/core/identity/domain/structures'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useCurrentCollaboratorQuery } from '@/ui/identity/hooks/use-current-collaborator-query'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { useMyCasePage } from '../use-my-case-page'
import { useMyCasePageAccess } from '../use-my-case-page-access'

vi.mock('@/ui/identity/hooks/use-current-collaborator-query', () => ({
  useCurrentCollaboratorQuery: vi.fn(),
}))
vi.mock('@/ui/case-management/hooks/use-case-team-query', () => ({
  useCaseTeamQuery: vi.fn(() => ({
    caseTeam: null,
    caseTeamError: null,
    isLoadingCaseTeam: false,
  })),
}))
vi.mock('../use-my-case-page-legal-data', () => ({
  useMyCasePageLegalData: vi.fn(() => ({
    caseDetails: { id: 'case-1', title: 'Case title', team: [] },
    caseError: null,
    isLoadingCase: false,
    caseTitle: 'Case title',
    caseLegalArea: 'Civil',
    caseClientName: 'Client name',
    checklistItems: [],
    completionPercentage: 0,
    mandatoryItemsCount: 0,
    pendingItemsCount: 0,
    validatedItemsCount: 0,
  })),
}))
vi.mock('@/ui/shared/hooks/use-rest-context', () => ({ useRestContext: vi.fn() }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const currentCollaboratorMock = vi.mocked(useCurrentCollaboratorQuery)
const restContextMock = vi.mocked(useRestContext)

function createQueryWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return {
    client,
    wrapper: ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client }, children),
  }
}

describe('useMyCasePageAccess', () => {
  beforeEach(() => {
    currentCollaboratorMock.mockReset()
  })

  it('allows active Admin users to load all case content only in administrator mode', () => {
    currentCollaboratorMock.mockReturnValue({
      currentCollaborator: {
        collaboratorId: 'admin-1',
        profile: CollaboratorProfile.Admin,
        status: UserStatus.Active,
      },
    } as never)

    const { result, rerender } = renderHook(
      ({ isAdministrator }) => useMyCasePageAccess(isAdministrator),
      { initialProps: { isAdministrator: true } },
    )
    expect(result.current.canLoadLegalContent).toBe(true)

    rerender({ isAdministrator: false })
    expect(result.current.canLoadLegalContent).toBe(false)
  })

  it('allows active legal collaborators and denies inactive or unrelated profiles', () => {
    currentCollaboratorMock.mockReturnValue({
      currentCollaborator: {
        collaboratorId: 'lawyer-1',
        profile: CollaboratorProfile.Lawyer,
        status: UserStatus.Active,
      },
    } as never)
    const { result, rerender } = renderHook(
      ({ isAdministrator }) => useMyCasePageAccess(isAdministrator),
      { initialProps: { isAdministrator: false } },
    )
    expect(result.current.canLoadLegalContent).toBe(true)

    rerender({ isAdministrator: true })
    expect(result.current.canLoadLegalContent).toBe(false)

    currentCollaboratorMock.mockReturnValue({
      currentCollaborator: {
        collaboratorId: 'inactive-1',
        profile: CollaboratorProfile.Lawyer,
        status: UserStatus.Disabled,
      },
    } as never)
    rerender({ isAdministrator: false })
    expect(result.current.canLoadLegalContent).toBe(false)

    currentCollaboratorMock.mockReturnValue({
      currentCollaborator: {
        collaboratorId: 'client-1',
        profile: CollaboratorProfile.Client,
        status: UserStatus.Active,
      },
    } as never)
    rerender({ isAdministrator: false })
    expect(result.current.canLoadLegalContent).toBe(false)
  })
})

describe('useMyCasePage portal behavior', () => {
  let grantPortalAccessMock: ReturnType<typeof vi.fn>
  let listPortalAccessMock: ReturnType<typeof vi.fn>
  let listThirdPartiesMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    grantPortalAccessMock = vi.fn().mockResolvedValue({
      isFailure: false,
      body: { portalAccessUrl: '/portal/secret', expiresAt: '2026-10-09T12:00:00.000Z' },
    })
    listPortalAccessMock = vi.fn().mockResolvedValue({ isFailure: false, body: [] })
    listThirdPartiesMock = vi.fn().mockResolvedValue({
      isFailure: false,
      body: [
        { id: 'active-party', legalName: 'Active company', status: 'active' },
        { id: 'inactive-party', legalName: 'Inactive company', status: 'inactive' },
      ],
    })
    currentCollaboratorMock.mockReturnValue({
      currentCollaborator: {
        collaboratorId: 'lawyer-1',
        profile: CollaboratorProfile.Lawyer,
        status: UserStatus.Active,
      },
    } as never)
    restContextMock.mockReturnValue({
      caseManagementService: {
        grantCasePortalAccess: grantPortalAccessMock,
        listCasePortalAccess: listPortalAccessMock,
      },
      identityService: { listThirdParties: listThirdPartiesMock },
    } as never)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    })
  })

  it('filters inactive recipients, restores their prior permissions, generates and copies a link, then clears access settings on close', async () => {
    listPortalAccessMock.mockResolvedValue({
      isFailure: false,
      body: [
        {
          thirdPartyId: 'active-party',
          canViewCaseStatus: true,
          canViewIntakeStatus: false,
          canUpload: true,
        },
      ],
    })
    const { client, wrapper } = createQueryWrapper()
    const { result } = renderHook(() => useMyCasePage({ caseId: 'case-1' }), { wrapper })

    await waitFor(() => expect(result.current.thirdParties).toHaveLength(1))
    expect(result.current.selectedThirdPartyId).toBe('active-party')
    expect(result.current.canViewCaseStatus).toBe(true)
    expect(result.current.canViewIntakeStatus).toBe(false)
    expect(result.current.canUpload).toBe(true)

    await act(async () => {
      await result.current.handleGeneratePortalLink()
    })
    expect(grantPortalAccessMock).toHaveBeenCalledWith('case-1', {
      canUpload: true,
      canViewCaseStatus: true,
      canViewIntakeStatus: false,
      thirdPartyId: 'active-party',
    })
    expect(result.current.portalAccessUrl).toBe(`${window.location.origin}/portal/secret`)
    expect(result.current.portalAccessExpiresAt).toBe('2026-10-09T12:00:00.000Z')
    expect(listPortalAccessMock).toHaveBeenCalledTimes(2)

    await act(async () => {
      await result.current.handleCopyPortalLink()
    })
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      `${window.location.origin}/portal/secret`,
    )

    act(() => result.current.handleClosePortalAccessDialog())
    expect(result.current.portalAccessUrl).toBeNull()
    expect(result.current.portalAccessExpiresAt).toBeNull()
    expect(result.current.canViewCaseStatus).toBe(false)
    expect(result.current.canViewIntakeStatus).toBe(false)
    expect(result.current.canUpload).toBe(false)
    expect(result.current.selectedThirdPartyId).toBe('active-party')
    act(() => result.current.handleOpenChecklistTab())
    expect(result.current.activeTab).toBe('checklist')
    client.clear()
  })

  it('skips generation without a recipient and handles grant and clipboard failures', async () => {
    const { client, wrapper } = createQueryWrapper()
    const { result } = renderHook(() => useMyCasePage({ caseId: 'case-2' }), { wrapper })
    await waitFor(() => expect(result.current.thirdParties).toHaveLength(1))
    await act(async () => {
      await result.current.handleGeneratePortalLink()
    })
    expect(grantPortalAccessMock).not.toHaveBeenCalled()

    act(() => {
      result.current.setSelectedThirdPartyId('active-party')
      result.current.setCanUpload(true)
    })
    const grantError = new Error('Grant failed')
    grantPortalAccessMock.mockResolvedValueOnce({
      isFailure: true,
      throwError: () => {
        throw grantError
      },
    })
    await expect(result.current.handleGeneratePortalLink()).rejects.toBe(grantError)
    expect(result.current.portalAccessUrl).toBeNull()

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error('Clipboard denied')) },
    })
    act(() => result.current.setPortalAccessUrl('https://portal.example/access'))
    await act(async () => {
      await result.current.handleCopyPortalLink()
    })
    client.clear()
  })

  it('uses the fallback case identifier and does not restore access to an inactive recipient', async () => {
    listPortalAccessMock.mockResolvedValue({
      isFailure: false,
      body: [
        {
          thirdPartyId: 'inactive-party',
          canViewCaseStatus: true,
          canViewIntakeStatus: true,
          canUpload: true,
        },
      ],
    })
    const { client, wrapper } = createQueryWrapper()
    const { result } = renderHook(() => useMyCasePage({}), { wrapper })

    await waitFor(() => expect(listPortalAccessMock).toHaveBeenCalled())
    expect(result.current.caseUuid).toBe('00000000-0000-4000-8000-000000000089')
    expect(result.current.selectedThirdPartyId).toBe('')
    expect(result.current.canViewCaseStatus).toBe(false)
    expect(result.current.canViewIntakeStatus).toBe(false)
    expect(result.current.canUpload).toBe(false)
    expect(listPortalAccessMock).toHaveBeenCalledWith(
      '00000000-0000-4000-8000-000000000089',
    )
    client.clear()
  })
})
